const DeLorean = ({ color = '#05d9e8' }) => {
    return (
        <group position={[0, 0.5, -6]}>
            {/* Main body */}
            <mesh>
                <boxGeometry args={[2, 0.5, 4]} />
                <meshStandardMaterial color="#888" metalness={0.95} roughness={0.05} />
            </mesh>
            {/* Cabin */}
            <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[1.8, 0.5, 2]} />
                <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Flux capacitor glow */}
            <mesh position={[0, 0.3, 0.5]}>
                <boxGeometry args={[0.3, 0.3, 0.1]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={4}
                    toneMapped={false}
                />
            </mesh>
            {/* Time circuits */}
            <mesh position={[0, 0.8, -0.2]}>
                <boxGeometry args={[0.8, 0.15, 0.4]} />
                <meshStandardMaterial
                    color="#ff2a6d"
                    emissive="#ff2a6d"
                    emissiveIntensity={2}
                    toneMapped={false}
                />
            </mesh>
            {/* Underglow */}
            <mesh position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[2.2, 4.2]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={1.5}
                    transparent
                    opacity={0.4}
                    toneMapped={false}
                />
            </mesh>
            <pointLight position={[0, 0.2, -2.5]} color="#ffffff" intensity={2} distance={15} />
        </group>
    )
}

export default DeLorean
