// @ts-ignore
import ReactDOM from 'react-dom'
import { setBatchedUpdates } from '@reatom/react-v2'

setBatchedUpdates(ReactDOM.unstable_batchedUpdates)
