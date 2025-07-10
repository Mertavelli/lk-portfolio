// Neue Version der ComposableImage.tsx
import { Image } from '@studio-freight/compono'
import cn from 'clsx'
import s from './composable-image.module.scss'

export function ComposableImage({
  src,
  title,
  width = 684,
  height = 403,
  large = false,
  small = false,
  priority = false,
}) {
  if (!src) return null

  const isVideo = src.includes('videos.ctfassets.net')

  return (
    <div className={s.images}>
      {isVideo ? (
        <div
          className={cn(
            s.image,
            s.videoWrap,
            large && s.large,
            small && s.small,
          )}
        >
          <video src={src} muted loop autoPlay playsInline preload="auto" />
        </div>
      ) : (
        <Image
          src={src}
          alt={title || 'Media'}
          width={width}
          height={height}
          className={cn(s.image, large && s.large, small && s.small)}
          style={{ '--height': height, '--width': width }}
          priority={priority}
          quality={95}
          sizes="(max-width: 768px) 100vw, 75vw"
        />
      )}
    </div>
  )
}
