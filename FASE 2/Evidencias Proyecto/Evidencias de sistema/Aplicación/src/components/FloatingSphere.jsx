// src/components/FloatingSphere.jsx
import { Sphere } from "@react-three/drei";
import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";

export default function FloatingSphere({
    position,
    color,
    onClick,
    onPointerOver,
    onPointerOut,
    selected
}) {
    const ref = useRef();
    const [hovered, setHovered] = useState(false);
    const isPlaying = selected; // o prop que pases desde arriba
    const targetScale = hovered || selected ? 1.4 : isPlaying ? 1.3 : 1;

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();

        // Flotación vertical
        ref.current.position.y = position[1] + Math.sin(t + position[0]) * 0.08;
        ref.current.rotation.y += 0.002;

        // Interpolación suave de escala
        const targetScale = hovered || selected ? 1.4 : 1;
        ref.current.scale.x += (targetScale - ref.current.scale.x) * 0.1;
        ref.current.scale.y += (targetScale - ref.current.scale.y) * 0.1;
        ref.current.scale.z += (targetScale - ref.current.scale.z) * 0.1;
    });

    return (
        <Sphere
            ref={ref}
            args={[0.25, 64, 64]}
            position={position}
            onClick={onClick}
            onPointerOver={(e) => {
                e.stopPropagation();
                setHovered(true);
                onPointerOver?.(e); // ejecuta si hay handler externo
            }}
            onPointerOut={(e) => {
                e.stopPropagation();
                setHovered(false);
                onPointerOut?.(e);
            }}
        >
            <meshPhysicalMaterial
                transmission={1}
                roughness={0.05}
                thickness={1}
                color={color}
                envMapIntensity={hovered ? 2 : 1.2}  // 🔹 un poco más brillante al hover
                clearcoat={1}
                clearcoatRoughness={0.1}
                ior={1.4}
                metalness={hovered ? 0.3 : 0.1}     // 🔹 leve cambio metálico
            />
        </Sphere>
    );
}
