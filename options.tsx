import DebugTimelineProcessor from "~components/debug-timeline-processor"
import ErrorBoundary from "~components/errors/ErrorBoundary"
import { IndexDbDuplicator } from "~components/IndexDbDuplicator"
import InterceptorDashboard from "~components/InterceptorDashboard"
import SignIn from "~components/SignIn"
import { isDev } from "~utils/devUtils"

import "~/prod.css"

function IndexOptions() {
  
  return (
    <>
      <SignIn />
      <ErrorBoundary>
        <InterceptorDashboard />
      </ErrorBoundary>

      {isDev && (
        <>
          <ErrorBoundary>
            <IndexDbDuplicator />
          </ErrorBoundary>

          <DebugTimelineProcessor />
        </>
      )}
    </>
  )
}

export default IndexOptions
