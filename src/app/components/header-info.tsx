import { Fragment, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Dot } from './dot'

type TextBadge = {
  content: string | null
  type: 'text'
}

type LinkBadge = {
  content: string | null
  type: 'link'
  link: string
}

type ComponentBadge = {
  content: ReactNode
  type: 'component'
}

export type BadgesData = Array<TextBadge | LinkBadge | ComponentBadge>

interface HeaderInfoProps {
  showFirstDot?: boolean
  badges: BadgesData
}

export function HeaderInfoGenerator({
  showFirstDot = true,
  badges,
}: HeaderInfoProps) {
  return (
    <div className="flex text-sm items-center">
      <Fragment>
        {badges
          .filter((item) => item.content)
          .map((item, index, array) => (
            <Fragment key={index}>
              {showFirstDot && index === 0 && <Dot />}
              {item.type === 'link' ? (
                <Link
                  to={item.link}
                  className="flex opacity-80 text-shadow-md hover:opacity-100 hover:underline"
                >
                  {item.content as string}
                </Link>
              ) : item.type === 'component' ? (
                <div className="flex items-center">{item.content}</div>
              ) : (
                <p className="opacity-80 text-shadow-md">
                  {item.content as string}
                </p>
              )}
              {index < array.length - 1 && <Dot />}
            </Fragment>
          ))}
      </Fragment>
    </div>
  )
}
