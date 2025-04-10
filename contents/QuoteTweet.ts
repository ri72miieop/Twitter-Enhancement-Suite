import type { PlasmoGetShadowHostId } from "plasmo"

import type { PlasmoMountShadowHost } from "plasmo"

export const getShadowHostId: PlasmoGetShadowHostId = ({ element }) =>
    element.getAttribute("aria-labelledby") + `-QTs`
  
  
  export const mountShadowHost: PlasmoMountShadowHost = ({
    shadowHost,
    anchor,
    mountState
  }) => {
    anchor.element.appendChild(shadowHost)
    mountState.observer.disconnect() // OPTIONAL DEMO: stop the observer as needed
  }
  