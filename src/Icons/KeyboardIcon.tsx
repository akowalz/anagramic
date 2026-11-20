type Props = {
  // Adds a chevron under the keyboard, to say it can be put away
  hide?: boolean
}

export default function KeyboardIcon({ hide = false }: Props) {
  return (
    <svg
      width={24}
      height={24}
      // Without the chevron the keyboard moves down to stay centered
      viewBox={hide ? "0 0 24 24" : "0 -3.5 24 24"}
      fill="none"
    >
      <rect
        x={2}
        y={3}
        width={20}
        height={11}
        rx={2}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path
        d="M6 7H6.01M10 7H10.01M14 7H14.01M18 7H18.01M8 10.5H16"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
      {hide && (
        <path
          d="M9 18L12 21L15 18"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}
