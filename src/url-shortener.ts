import { URLError } from './errors'
import { clean } from 'tidy-url'

export default function shortenUrl (url: string): string {
  const $url = new URL(clean(url).url)

  const isYoutubeHostname = $url.hostname.includes('youtube.com')
  const isYoutubeVideoPage =
    $url.pathname.startsWith('/watch') ||
    $url.pathname.startsWith('/v/')

  if (isYoutubeHostname && isYoutubeVideoPage) {
    const videoId =
      $url.searchParams.get('v') ??
      $url.pathname.split('/').at(-1)

    if (videoId === undefined) {
      throw new URLError('Unable to shorten YouTube video URL')
    }

    return `https://youtu.be/${videoId}`
  }

  return url
}
