// src/HierarchyScene.jsx
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Environment, Billboard } from "@react-three/drei";
import { useState, useRef, useEffect } from "react";
import FloatingSphere from "./components/FloatingSphere";
import "./styles.css";

/* ---- Componente interno que vive dentro del Canvas ---- */
function SceneContent({ data, selectedGenre, setSelectedGenre, selectedArtist, setSelectedArtist }) {
    const fadeRef = useRef(1);
    const [fade, setFade] = useState(1);
    const [hoveredGenre, setHoveredGenre] = useState(null);
    const genreColors = {
        jazz: "#8ac7db",
        rock: "#f27272",
        pop: "#f3b562",
        electronic: "#b086f9",
        classical: "#9ecf8b",
    };

    useFrame((state, delta) => {
        fadeRef.current = Math.min(1, fadeRef.current + delta);
        setFade(fadeRef.current);
    });

    return (
        <>
            {/* NIVEL 1: Géneros */}
            {!selectedGenre &&
                data.map((genre, i) => (
                    <group key={i}>
                        <FloatingSphere
                            position={[
                                genre.centroid[0] * 3,
                                genre.centroid[1] * 3,
                                genre.centroid[2] * 3,
                            ]}
                            color={genreColors[genre.genre] || "#b28bff"}
                            onPointerOver={(e) => {
                                e.stopPropagation(); // 👈 evita que se propague y se pierda
                                setHoveredGenre(genre.genre);
                            }}
                            onPointerOut={(e) => {
                                e.stopPropagation();
                                setHoveredGenre(null);
                            }}
                            onClick={() => {
                                fadeRef.current = 0;
                                setSelectedGenre(genre);
                            }}
                            selected={false}
                        />

                        {/* Etiqueta HTML del género */}
                        {hoveredGenre === genre.genre && (
                            <Html
                                position={[
                                    genre.centroid[0] * 3,
                                    genre.centroid[1] * 3 + 0.4, // un poco arriba
                                    genre.centroid[2] * 3,
                                ]}
                                center
                                distanceFactor={8}
                            >
                                <div className="genre-label">{genre.genre}</div>
                            </Html>
                        )}
                    </group>
                ))}

            {/* NIVEL 2: Artistas */}
            {selectedGenre &&
                selectedGenre.artists.map((artist, j) => (
                    <group key={j}>
                        <FloatingSphere
                            position={[
                                artist.centroid[0],
                                artist.centroid[1],
                                artist.centroid[2],
                            ]}
                            color="#f39c12"
                            onClick={() => setSelectedArtist(artist)}
                            selected={selectedArtist === artist}
                        />
                    </group>
                ))}

            {/* Tooltip */}
            <Html center style={{ opacity: fade }}>
                <div className="tooltip">
                    {!selectedGenre && <b>Selecciona un género 🎧</b>}
                    {selectedGenre && !selectedArtist && (
                        <div>
                            <b>{selectedGenre.genre}</b>
                            <br />
                            {selectedGenre.artists.length} artistas
                        </div>
                    )}
                    {selectedArtist && (
                        <div>
                            <b>{selectedArtist.artist_name}</b>
                            <br />
                            {selectedArtist.tracks.length} canciones
                        </div>
                    )}
                </div>
            </Html>
        </>
    );
}

/* ---- Componente principal ---- */
export default function HierarchyScene() {
    const [selectedGenre, setSelectedGenre] = useState(null);
    const [selectedArtist, setSelectedArtist] = useState(null);
    const [data, setData] = useState([]);
    const [projection, setProjection] = useState("umap");
    const [center, setCenter] = useState([0, 0, 0]);

    // Función para calcular centro dinámico
    function getSceneCenter(dataset) {
        const points = [];
        dataset.forEach((g) => {
            points.push(g.centroid);
            g.artists.forEach((a) => {
                points.push(a.centroid);
                a.tracks.forEach((t) => {
                    const x = t.PC1 ?? t.U1;
                    const y = t.PC2 ?? t.U2;
                    const z = t.PC3 ?? t.U3;
                    if (x !== undefined && y !== undefined && z !== undefined) {
                        points.push([x, y, z]);
                    }
                });
            });
        });
        if (points.length === 0) return [0, 0, 0];
        const n = points.length;
        return points.reduce(
            (acc, p) => [acc[0] + p[0] / n, acc[1] + p[1] / n, acc[2] + p[2] / n],
            [0, 0, 0]
        );
    }

    // Cargar dataset según proyección seleccionada
    useEffect(() => {
        import(`./data/minoise_hierarchy_${projection}.json`)
            .then((module) => {
                setData(module.default);
                const c = getSceneCenter(module.default);
                setCenter(c);
                setSelectedGenre(null);
                setSelectedArtist(null);
            })
            .catch((err) => console.error("Error cargando dataset:", err));
    }, [projection]);

    return (
        <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
            {/* Selector de proyección */}
            <div className="projection-selector">
                <button
                    onClick={() => setProjection("pca")}
                    className={projection === "pca" ? "active" : ""}
                >
                    PCA
                </button>
                <button
                    onClick={() => setProjection("umap")}
                    className={projection === "umap" ? "active" : ""}
                >
                    UMAP
                </button>
            </div>

            {/* Botón volver */}
            {selectedGenre && (
                <button
                    onClick={() => {
                        if (selectedArtist) setSelectedArtist(null);
                        else setSelectedGenre(null);
                    }}
                    className="back-button"
                >
                    ← Volver
                </button>
            )}

            <Canvas camera={{ position: [center[0], center[1], 12] }}>
                <ambientLight intensity={0.4} />
                <directionalLight position={[5, 5, 5]} intensity={2} />
                <Environment preset="sunset" background={false} />
                <OrbitControls target={center} autoRotate autoRotateSpeed={0.8} />

                {/* Contenido */}
                <SceneContent
                    data={data}
                    selectedGenre={selectedGenre}
                    setSelectedGenre={setSelectedGenre}
                    selectedArtist={selectedArtist}
                    setSelectedArtist={setSelectedArtist}
                />
            </Canvas>
        </div>
    );
}
