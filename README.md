# @tskau/vtrans

yandex video translation API client written in typescript
<img align="right" height="50" src="./assets/vtrans.svg">

### disclaimer

this library is UNOFFICIAL and NOT MADE OR AUTHORIZED by
[Yandex N.V.](https://ir.yandex/) or [ООО "ЯНДЕКС" (Yandex LLC)](https://yandex.ru/company/main).

this library is based on the results of reverse engineering
and implements a client for a private API that is
NOT INTENDED for use in software other than [yandex.browser](https://browser.yandex.com/).

### installation

```bash
npm install --save @tskau/vtrans
# yarn install @tskau/vtrans
# pnpm add @tskau/vtrans
```

### usage example

```js
// you can use require() to use tobalt
// const { Client } = require('@tskau/vtrans')
import { Client } from '@tskau/vtrans'

// you can use the vot-worker if you need
// https://github.com/FOSWLY/vot-worker
const client = new Client({ /* baseUrl: 'https://vot.toil.cc/' */ })

// translate the video
try {
  const translationResult = await client.translate({
    originalUrl: 'https://www.youtube.com/watch?v=rEQm1wU_b9M',
    originalLanguage: 'ru', // ru, en, zh, ko, ar, fr, it, es, de, ja
    translationLanguage: 'en' // ru, en, kk
  })

  if (translationResult.status === 'WORK_IN_PROGRESS') {
    translationResult.remainingTime // translation remaining time
                                    // can be undefined if it's not provided by server
  }

  if (translationResult.status === 'SUCCESS') {
    await translationResult.translation.content.stream() // readable stream
    await translationResult.translation.content.save('/tmp/dolphin-naprosilis-english.mp3') // save as file
    translationResult.translation.content.url // 'https://vtrans.s3-private.mds.yandex.net/...'

    translationResult.translation.duration // duration in seconds
  }
} catch (error) {
  // if error is TranslationError
  // then error message is likely in russian
  // because it's sourced from yandex servers
  console.log(error.message)
}

// fetch subtitles
try {
  const subtitlesResult = await client.getSubtitles({
    originalUrl: 'https://www.youtube.com/watch?v=rEQm1wU_b9M',
    originalLanguage: 'ru' // ru, en, zh, ko, kk, ar, fr, it, es, de, ja
  })

  subtitlesResult.original.language // 'ru'

  await subtitlesResult.original.content.stream() // readable stream
  await subtitlesResult.original.content.save('/tmp/dolphin-naprosilis-russian-yandex.json') // save as file
  subtitlesResult.original.content.url // 'https://brosubs.s3-private.mds.yandex.net/...'

  subtitlesResult.translations[0].language // 'en'

  await subtitlesResult.translations[0].content.stream() // readable stream
  await subtitlesResult.translations[0].content.save('/tmp/dolphin-naprosilis-english-yandex.json') // save as file
  subtitlesResult.translations[0].content.url // 'https://brosubs.s3-private.mds.yandex.net/...'
} catch (error) {
  console.log(error.message) // 'Subtitles not found'
}
```

### acknowledgements
all this exists thanks to [Toil](https://github.com/ilyhalight)'s implementation of the CLI/browser extension.

check out the [vot-cli](https://github.com/FOSWLY/vot-cli) (CLI) or [voice-over-translation](https://github.com/ilyhalight/voice-over-translation) (browser extension).
