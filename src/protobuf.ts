import protobuf from 'protobufjs'
import path from 'node:path'

const VSUBS_PROTO_PATH = path.join(__dirname, '../proto/vsubs.proto')
const VTRANS_PROTO_PATH = path.join(__dirname, '../proto/vtrans.proto')

export const root = protobuf.loadSync([VSUBS_PROTO_PATH, VTRANS_PROTO_PATH])

export const vtrans = {
  VideoTranslationHelpObject: root.lookupType('yandex.vtrans.VideoTranslationHelpObject'),
  VideoTranslationRequest: root.lookupType('yandex.vtrans.VideoTranslationRequest'),
  VideoTranslationResponseStatus: root.lookupType('yandex.vtrans.VideoTranslationResponseStatus'),
  VideoTranslationResponse: root.lookupType('yandex.vtrans.VideoTranslationResponse')
}

export const vsubs = {
  VideoSubtitlesRequest: root.lookupType('yandex.vsubs.VideoSubtitlesRequest'),
  VideoSubtitlesObject: root.lookupType('yandex.vsubs.VideoSubtitlesObject'),
  VideoSubtitlesResponse: root.lookupType('yandex.vsubs.VideoSubtitlesResponse')
}
