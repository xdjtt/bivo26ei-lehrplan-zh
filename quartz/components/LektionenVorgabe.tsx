import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

const LektionenVorgabe: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const lektionen = fileData.frontmatter?.lektionen_vorgabe
  if (!lektionen) {
    return null
  }
  return (
    <p class={classNames(displayClass, "lektionen-vorgabe")}>Empfohlene Anzahl Lektionen: {String(lektionen)}</p>
  )
}

LektionenVorgabe.css = `
.lektionen-vorgabe {
  margin: 1rem 0 0 0;
  font-weight: 600;
  color: var(--secondary);
}
`

export default (() => LektionenVorgabe) satisfies QuartzComponentConstructor
