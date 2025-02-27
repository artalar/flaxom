// @ts-ignore
import RN from 'react-native'
import { setBatchedUpdates } from '@reatom/react-v2'

setBatchedUpdates(RN.unstable_batchedUpdates)
