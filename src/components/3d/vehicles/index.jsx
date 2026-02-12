import TronLightCycle from './TronLightCycle'
import DeLorean from './DeLorean'
import CyberBike from './CyberBike'

const Vehicle = ({ type = 'tron', color }) => {
    switch (type) {
        case 'delorean':
            return <DeLorean color={color} />
        case 'cyberbike':
            return <CyberBike color={color} />
        case 'tron':
        default:
            return <TronLightCycle color={color} />
    }
}

export { TronLightCycle, DeLorean, CyberBike, Vehicle }
export default Vehicle
