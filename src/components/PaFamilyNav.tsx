/**
 * Same family row as PA Marine: a label, then the sibling sites.
 * https://sliothar1.github.io/PA-Marine-Demo/
 */
export function PaFamilyNav() {
  return (
    <nav className="pa-family" aria-label="The PA family of sites">
      <span className="pa-family-label">
        <i lang="ga">Teaghlach PA</i>
        {" · "}
        The PA family
      </span>
      <a href="https://sliothar1.github.io/PA-Marine-Demo/">PA Marine</a>
      <a href="https://sliothar1.github.io/pa-realt/">PA Réalt</a>
      <a href="https://sliothar1.github.io/pa-realt/family.html">
        All PA sites
      </a>
    </nav>
  );
}
