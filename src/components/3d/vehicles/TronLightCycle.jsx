import * as THREE from 'three'

const TronLightCycle = ({ color = '#05d9e8' }) => {
    return (
        <group position={[0, 0.6, -5]} rotation={[0, 0, 0]}>
            {/* Main body - sleek angular shape */}
            <mesh position={[0, 0.1, 0]}>
                <boxGeometry args={[0.4, 0.3, 2.8]} />
                <meshStandardMaterial color="#0a0a15" metalness={0.9} roughness={0.1} />
            </mesh>

            {/* Front fairing - angular nose */}
            <mesh position={[0, 0.2, -1.2]} rotation={[-0.3, 0, 0]}>
                <boxGeometry args={[0.35, 0.25, 0.8]} />
                <meshStandardMaterial color="#0a0a15" metalness={0.9} roughness={0.1} />
            </mesh>

            {/* Windscreen */}
            <mesh position={[0, 0.4, -0.8]} rotation={[-0.5, 0, 0]}>
                <planeGeometry args={[0.3, 0.4]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={2}
                    transparent
                    opacity={0.6}
                    toneMapped={false}
                />
            </mesh>

            {/* Front wheel - solid disc */}
            <mesh position={[0, 0, -1.3]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.4, 0.4, 0.15, 24]} />
                <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Front wheel glow ring */}
            <mesh position={[0, 0, -1.3]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.4, 0.03, 8, 32]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={4}
                    toneMapped={false}
                />
            </mesh>

            {/* Rear wheel - solid disc */}
            <mesh position={[0, 0, 1.1]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.45, 0.45, 0.2, 24]} />
                <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Rear wheel glow ring */}
            <mesh position={[0, 0, 1.1]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.45, 0.04, 8, 32]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={4}
                    toneMapped={false}
                />
            </mesh>

            {/* Light strips along body */}
            <mesh position={[0.21, 0.1, 0]}>
                <boxGeometry args={[0.02, 0.1, 2.5]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={3}
                    toneMapped={false}
                />
            </mesh>
            <mesh position={[-0.21, 0.1, 0]}>
                <boxGeometry args={[0.02, 0.1, 2.5]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={3}
                    toneMapped={false}
                />
            </mesh>

            {/* Tail light bar */}
            <mesh position={[0, 0.2, 1.4]}>
                <boxGeometry args={[0.35, 0.08, 0.02]} />
                <meshStandardMaterial
                    color="#ff2a6d"
                    emissive="#ff2a6d"
                    emissiveIntensity={5}
                    toneMapped={false}
                />
            </mesh>

            {/* Enhanced light trail effect - multiple layers for depth */}
            <mesh position={[0, 0.05, 4]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.12, 8]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={3}
                    transparent
                    opacity={0.6}
                    toneMapped={false}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>
            {/* Outer glow trail */}
            <mesh position={[0, 0.04, 5]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.4, 12]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.15}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>
            {/* Trail particles (simulated) */}
            <mesh position={[0, 0.06, 6]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.06, 15]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={4}
                    transparent
                    opacity={0.3}
                    toneMapped={false}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>

            {/* Headlight */}
            <pointLight position={[0, 0.2, -1.8]} color="#ffffff" intensity={3} distance={20} />
        </group>
    )
}

export default TronLightCycle
