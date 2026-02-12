const CyberBike = ({ color = '#ff2a6d' }) => {
    return (
        <group position={[0, 0.5, -5]}>
            {/* Frame */}
            <mesh position={[0, 0.2, 0]} rotation={[0, 0, 0]}>
                <boxGeometry args={[0.3, 0.4, 2.2]} />
                <meshStandardMaterial color="#1a1a2e" metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Tank */}
            <mesh position={[0, 0.5, -0.3]}>
                <boxGeometry args={[0.5, 0.3, 0.8]} />
                <meshStandardMaterial color="#0a0a15" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Front wheel */}
            <mesh position={[0, 0, -1]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.35, 0.08, 8, 24]} />
                <meshStandardMaterial color="#222" metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Rear wheel */}
            <mesh position={[0, 0, 0.9]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.4, 0.1, 8, 24]} />
                <meshStandardMaterial color="#222" metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Neon strips */}
            <mesh position={[0.2, 0.3, 0]}>
                <boxGeometry args={[0.02, 0.5, 1.8]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={4}
                    toneMapped={false}
                />
            </mesh>
            <mesh position={[-0.2, 0.3, 0]}>
                <boxGeometry args={[0.02, 0.5, 1.8]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={4}
                    toneMapped={false}
                />
            </mesh>
            {/* Tail light */}
            <mesh position={[0, 0.35, 1.1]}>
                <boxGeometry args={[0.25, 0.1, 0.02]} />
                <meshStandardMaterial
                    color="#ff2a6d"
                    emissive="#ff2a6d"
                    emissiveIntensity={5}
                    toneMapped={false}
                />
            </mesh>
            <pointLight position={[0, 0.3, -1.5]} color="#ffffff" intensity={2} distance={15} />
        </group>
    )
}

export default CyberBike
