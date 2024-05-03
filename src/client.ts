import { SubtitlesError, TranslationError } from './errors'
import { Content } from './content'
import * as globals from './globals'
import * as protobuf from './protobuf'
import signRequestBody from './signature'
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import crypto from 'node:crypto'
import shortenUrl from './url-shortener'

const VTRANS_API_PATH = '/video-translation/'
const VSUBS_API_PATH = '/video-subtitles/'

export interface ClientOptions {
  baseUrl?: string
}

export interface TranslationOptions {
  originalUrl: string
  originalLanguage: string
  originalDuration?: number
  translationLanguage: string
}

export interface TranslationResult {
  translation?: { content: Content, duration: number }
  remainingTime?: number
  status: 'SUCCESS' | 'WORK_IN_PROGRESS'
}

export interface SubtitlesOptions {
  originalUrl: string
  originalLanguage: string
}

export interface Subtitles {
  language: string
  content: Content
}

export interface SubtitlesResult {
  original: Subtitles
  translations: Subtitles[]
}

export class Client {
  private readonly axios: AxiosInstance

  constructor (options?: ClientOptions) {
    this.axios = axios.create({
      baseURL: options?.baseUrl ?? globals.YANDEX_BROWSER_API_URL,
      headers: {
        'Accept-Language': 'en',
        'User-Agent': globals.YANDEX_BROWSER_USER_AGENT,
        Pragma: 'no-cache',
        'Cache-Control': 'no-cache',
        'Sec-Fetch-Mode': 'no-cors'
      }
    })

    this.axios.interceptors.request.use(this.signRequestBody)
    this.axios.interceptors.request.use(this.setRequestToken)
  }

  private signRequestBody (
    request: InternalAxiosRequestConfig
  ): InternalAxiosRequestConfig {
    if (request.url !== undefined && request.headers !== undefined) {
      const header = request.url.startsWith(VTRANS_API_PATH)
        ? 'vtrans-signature'
        : 'vsubs-signature'
      const signature = signRequestBody(request.data)

      request.headers[header] = signature
    }

    return request
  }

  private setRequestToken (
    request: InternalAxiosRequestConfig
  ): InternalAxiosRequestConfig {
    if (request.url !== undefined && request.headers !== undefined) {
      const header = request.url.startsWith(VTRANS_API_PATH)
        ? 'sec-vtrans-token'
        : 'sec-vsubs-token'
      const token = crypto.randomUUID()

      request.headers[header] = token
    }

    return request
  }

  async translate (options: TranslationOptions): Promise<TranslationResult> {
    const videoTranslationRequest = protobuf.vtrans.VideoTranslationRequest
      .encode({
        originalUrl: shortenUrl(options.originalUrl),
        originalLanguage: options.originalLanguage,
        originalDuration: options.originalDuration ?? globals.DEFAULT_ORIGINAL_DURATION,
        translationLanguage: options.translationLanguage,
        isFirstRequest: true
      })
      .finish()

    const response = await this.axios.post(
      `${VTRANS_API_PATH}translate`,
      videoTranslationRequest,
      {
        headers: {
          Accept: 'application/x-protobuf',
          'Content-Type': 'application/x-protobuf'
        },
        transformResponse: function (data: Buffer) {
          return protobuf.vtrans.VideoTranslationResponse.decode(data).toJSON()
        },
        responseType: 'arraybuffer'
      }
    )

    switch (response.data.responseStatus) {
      case 'ERROR':
        throw new TranslationError(response.data.responseMessage)
      case 'WORK_IN_PROGRESS':
        return {
          remainingTime: response.data.remainingTime,
          status: 'WORK_IN_PROGRESS'
        }
      case 'SUCCESS':
        return {
          translation: {
            content: new Content(response.data.translationUrl),
            duration: response.data.translationDuration
          },
          status: 'SUCCESS'
        }
    }

    throw new TranslationError('Unknown response status')
  }

  async getSubtitles (options: SubtitlesOptions): Promise<SubtitlesResult> {
    const videoSubtitlesRequest = protobuf.vsubs.VideoSubtitlesRequest
      .encode({
        originalUrl: shortenUrl(options.originalUrl),
        originalLanguage: options.originalLanguage
      })
      .finish()

    const response = await this.axios.post(
      `${VSUBS_API_PATH}get-subtitles`,
      videoSubtitlesRequest,
      {
        headers: {
          accept: 'application/x-protobuf',
          'content-type': 'application/x-protobuf'
        },
        transformResponse: function (data: Uint8Array) {
          return protobuf.vsubs.VideoSubtitlesResponse.decode(data).toJSON()
        },
        responseType: 'arraybuffer'
      }
    )

    if (response.data.subtitles === undefined) {
      throw new SubtitlesError('Subtitles not found')
    }

    return {
      original: {
        language: response.data.subtitles[0].originalLanguage,
        content: new Content(response.data.subtitles[0].originalSubtitlesUrl)
      },
      translations: response.data.subtitles.map((subtitle: any) => ({
        language: subtitle.translationLanguage,
        content: new Content(subtitle.translationSubtitlesUrl)
      }))
    }
  }
}
