import { useLayoutEffect, useMemo, useRef, type CSSProperties } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  AbsoluteFill,
  Audio,
  cancelRender,
  continueRender,
  delayRender,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { dataVideoFontStack } from '../../shared/dataVideoFrame';
import { VIDEO_HEIGHT, VIDEO_WIDTH } from '../../shared/video';
import {
  buildWorldCupWinnerRaceData,
  getWorldCupWinnerFrameState,
  type WorldCupWinnerEntity,
  type WorldCupWinnerFrameState,
  type WorldCupWinnerRaceRow,
} from './winnerRace';
import { worldCupWinnersRaceVideoConfig } from './config';
import { introVoiceoverAsset } from './generated/introVoiceoverAsset';

const raceData = buildWorldCupWinnerRaceData(worldCupWinnersRaceVideoConfig.csv);
const fontStack = dataVideoFontStack;
const channelHandle = '@whoa-data';
const topN = worldCupWinnersRaceVideoConfig.topN;
const accentGold = '#FFD447';
const carModelPath = 'projects/world-cup-winners-race/models/kenney-car-kit/race.glb';
const roadGroundY = -24;
const rallyCameraRoll = THREE.MathUtils.degToRad(-10);
const laneMinX = -420;
const laneMaxX = 420;
const physicalLaneCount = raceData.entities.length;
const laneStep = (laneMaxX - laneMinX) / Math.max(1, physicalLaneCount - 1);
const roadWidth = laneMaxX - laneMinX + laneStep * 1.7;
const roadHalfWidth = roadWidth / 2;
const roadLength = 3400;
const roadCenterZ = 700;
const yearTrackLengthZ = 11800;
const yearMarkerHitZ = 1020;
const finalSnapshot = raceData.snapshots[raceData.snapshots.length - 1];
const stableLaneCodes = [...raceData.entities]
  .sort((entityA, entityB) =>
    (finalSnapshot?.ranks.get(entityA.id) ?? Number.POSITIVE_INFINITY) -
      (finalSnapshot?.ranks.get(entityB.id) ?? Number.POSITIVE_INFINITY) ||
    entityA.name.localeCompare(entityB.name)
  )
  .map((entity) => entity.id);
const stableLaneIndexByCode = new Map(stableLaneCodes.map((code, index) => [code, index]));

type RallyLayout = {
  baseRoadZ: number;
  boostPower: number;
  laneX: number;
  opacity: number;
  pitch: number;
  previousRank: number;
  roadZ: number;
  roll: number;
  scale: number;
  targetRank: number;
  yaw: number;
};

type CountryCarModel = {
  boostTrailMaterial: THREE.MeshBasicMaterial;
  bodyAccentMaterial: THREE.MeshPhysicalMaterial;
  flagTexture: THREE.CanvasTexture;
  floorLabel: THREE.Mesh;
  glowMaterial: THREE.MeshBasicMaterial;
  group: THREE.Group;
  headlightMaterial: THREE.MeshBasicMaterial;
  statContext: CanvasRenderingContext2D;
  statMaterial: THREE.MeshBasicMaterial;
  statSignature: string;
  statTexture: THREE.CanvasTexture;
  wheels: THREE.Object3D[];
};

type YearMarkerModel = {
  group: THREE.Group;
  materials: THREE.MeshBasicMaterial[];
  monthIndex: number;
};

type FinishLineModel = {
  group: THREE.Group;
  materials: THREE.MeshBasicMaterial[];
};

type WorldCupItemModel = {
  burstMaterial: THREE.MeshBasicMaterial;
  burstRing: THREE.Mesh;
  glowMaterial: THREE.MeshBasicMaterial;
  group: THREE.Group;
  materials: THREE.Material[];
  sparkMaterial: THREE.MeshBasicMaterial;
  sparks: THREE.Mesh[];
};

type ThreeRallyHandle = {
  camera: THREE.PerspectiveCamera;
  cars: Map<string, CountryCarModel>;
  finishLine: FinishLineModel;
  renderer: THREE.WebGLRenderer;
  roadDashes: THREE.Mesh[];
  scene: THREE.Scene;
  speedStars: THREE.Mesh[];
  worldCupItem: WorldCupItemModel;
  yearMarkers: YearMarkerModel[];
};

export const WorldCupWinnersRaceVideo = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const startHoldFrames = Math.round(worldCupWinnersRaceVideoConfig.startHoldSeconds * fps);
  const endHoldFrames = Math.round(worldCupWinnersRaceVideoConfig.endHoldSeconds * fps);
  const raceDurationInFrames = Math.max(1, durationInFrames - startHoldFrames - endHoldFrames);
  const raceFrame = clamp(frame - startHoldFrames, 0, raceDurationInFrames - 1);
  const state = getWorldCupWinnerFrameState({
    data: raceData,
    durationInFrames: raceDurationInFrames,
    frame: raceFrame,
    topN,
  });
  const progress = (state.monthIndex - raceData.minMonthIndex) /
    Math.max(1, raceData.maxMonthIndex - raceData.minMonthIndex);

  return (
    <AbsoluteFill style={styles.stage}>
      {introVoiceoverAsset ? (
        <Audio
          src={staticFile(introVoiceoverAsset.path)}
          volume={worldCupWinnersRaceVideoConfig.introVoiceoverVolume}
        />
      ) : null}
      <SpaceBackground frame={frame} />
      <RallyTrackGlow />
      <ThreeRallyScene frame={raceFrame} progress={progress} state={state} />
      <DiagonalTitle state={state} />
      <RaceHud progress={progress} state={state} />
      <Footer />
    </AbsoluteFill>
  );
};

const ThreeRallyScene = ({
  frame,
  progress,
  state,
}: {
  frame: number;
  progress: number;
  state: WorldCupWinnerFrameState;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<ThreeRallyHandle | null>(null);
  const renderHandleRef = useRef<number | null>(null);
  const carModelUrl = staticFile(carModelPath);

  if (renderHandleRef.current === null) {
    renderHandleRef.current = delayRender('Loading World Cup rally car models');
  }

  useLayoutEffect(() => {
    if (!canvasRef.current) {
      return undefined;
    }

    let cancelled = false;
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });

    renderer.setSize(VIDEO_WIDTH, VIDEO_HEIGHT, false);
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.04;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(54, VIDEO_WIDTH / VIDEO_HEIGHT, 0.1, 5600);

    setRallyCamera(camera, new THREE.Vector3(-1180, 1180, 150), new THREE.Vector3(-55, 50, 710));
    scene.add(camera);

    scene.add(new THREE.AmbientLight(0x99b5da, 1.25));

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(-420, 720, -360);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.left = -900;
    keyLight.shadow.camera.right = 900;
    keyLight.shadow.camera.top = 1100;
    keyLight.shadow.camera.bottom = -700;
    keyLight.shadow.camera.near = 120;
    keyLight.shadow.camera.far = 2200;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x72bbff, 1.9);
    rimLight.position.set(720, 360, 320);
    scene.add(rimLight);

    const warmSpot = new THREE.PointLight(0xffd447, 1.45, 820, 1.6);
    warmSpot.position.set(-100, 180, 640);
    scene.add(warmSpot);

    const { group: road, dashes, yearMarkers } = createRoadModel();
    const finishLine = createFinishLineModel();
    const worldCupItem = createWorldCupItemModel();
    const speedStars = createSpeedStars();

    scene.add(road);
    scene.add(finishLine.group);
    scene.add(worldCupItem.group);
    for (const star of speedStars) {
      scene.add(star);
    }

    loadGltfScene(carModelUrl)
      .then((template) => {
        if (cancelled) {
          disposeObject(template);
          return;
        }

        const cars = new Map<string, CountryCarModel>();

        for (const entity of raceData.entities) {
          const car = createCountryCar(entity, template);

          car.group.visible = false;
          car.floorLabel.visible = false;
          cars.set(entity.id, car);
          scene.add(car.group);
          scene.add(car.floorLabel);
        }

        const handle = {
          camera,
          cars,
          finishLine,
          renderer,
          roadDashes: dashes,
          scene,
          speedStars,
          worldCupItem,
          yearMarkers,
        };

        handleRef.current = handle;
        renderThreeFrame(handle, state, frame, progress);

        if (renderHandleRef.current !== null) {
          continueRender(renderHandleRef.current);
          renderHandleRef.current = null;
        }

        disposeObject(template);
      })
      .catch((error: unknown) => {
        if (renderHandleRef.current !== null) {
          cancelRender(error);
          renderHandleRef.current = null;
        }
      });

    return () => {
      cancelled = true;

      const handle = handleRef.current;

      if (handle) {
        for (const car of handle.cars.values()) {
          disposeObject(car.group);
          disposeObject(car.floorLabel);
          car.flagTexture.dispose();
        }

        for (const dash of handle.roadDashes) {
          dash.geometry.dispose();
          disposeMaterial(dash.material);
        }

        for (const star of handle.speedStars) {
          star.geometry.dispose();
          disposeMaterial(star.material);
        }

        disposeObject(handle.finishLine.group);
        disposeObject(handle.worldCupItem.group);
      }

      disposeObject(road);
      renderer.dispose();
      handleRef.current = null;

      if (renderHandleRef.current !== null) {
        continueRender(renderHandleRef.current);
        renderHandleRef.current = null;
      }
    };
  }, [carModelUrl]);

  useLayoutEffect(() => {
    const handle = handleRef.current;

    if (!handle) {
      return;
    }

    renderThreeFrame(handle, state, frame, progress);
  }, [frame, progress, state]);

  return <canvas ref={canvasRef} height={VIDEO_HEIGHT} style={styles.threeCanvas} width={VIDEO_WIDTH} />;
};

const loadGltfScene = (url: string) =>
  new Promise<THREE.Group>((resolve, reject) => {
    new GLTFLoader().load(
      url,
      (gltf) => resolve(gltf.scene),
      undefined,
      reject,
    );
  });

const createCountryCar = (
  entity: WorldCupWinnerEntity,
  template: THREE.Object3D,
): CountryCarModel => {
  const color = normalizeHexColor(entity.color) ?? '#45E3AE';
  const group = new THREE.Group();
  const base = template.clone(true);
  const box = new THREE.Box3().setFromObject(base);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();

  box.getSize(size);
  box.getCenter(center);
  base.position.sub(center);
  base.scale.setScalar(185 / Math.max(size.x, size.y, size.z));

  if (size.x > size.z) {
    base.rotation.y = -Math.PI / 2;
  }

  const wheels: THREE.Object3D[] = [];

  base.traverse((child) => {
    const mesh = child as THREE.Mesh;

    if (!mesh.isMesh) {
      return;
    }

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    if (child.name.toLowerCase().includes('wheel')) {
      wheels.push(child);
    }
  });

  group.add(base);

  const flagTexture = createFlagTexture(entity.code);
  const flagPlate = new THREE.Mesh(
    new THREE.PlaneGeometry(112, 70),
    new THREE.MeshBasicMaterial({
      map: flagTexture,
      toneMapped: false,
    }),
  );

  flagPlate.rotation.x = -Math.PI / 2;
  flagPlate.position.set(0, 43, 8);
  group.add(flagPlate);

  const bodyAccentMaterial = new THREE.MeshPhysicalMaterial({
    clearcoat: 0.9,
    clearcoatRoughness: 0.18,
    color,
    emissive: color,
    emissiveIntensity: 0.12,
    metalness: 0.34,
    roughness: 0.26,
  });
  const sidePanel = new THREE.Mesh(new THREE.BoxGeometry(126, 12, 34), bodyAccentMaterial);
  const sidePanelMirror = sidePanel.clone();

  sidePanel.position.set(-1, 17, -7);
  sidePanelMirror.position.set(-1, 17, 31);
  group.add(sidePanel);
  group.add(sidePanelMirror);

  const glowMaterial = new THREE.MeshBasicMaterial({
    color,
    depthWrite: false,
    opacity: 0.14,
    transparent: true,
  });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(190, 270), glowMaterial);

  glow.rotation.x = -Math.PI / 2;
  glow.position.y = -10;
  group.add(glow);

  const boostTrailMaterial = new THREE.MeshBasicMaterial({
    blending: THREE.AdditiveBlending,
    color,
    depthWrite: false,
    map: createBoostTrailTexture(),
    opacity: 0,
    side: THREE.DoubleSide,
    transparent: true,
  });
  const boostTrail = new THREE.Mesh(new THREE.PlaneGeometry(76, 250), boostTrailMaterial);

  boostTrail.rotation.x = -Math.PI / 2;
  boostTrail.position.set(0, 5, -132);
  group.add(boostTrail);

  const headlightMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    opacity: 0.72,
    transparent: true,
  });
  const headlightLeft = new THREE.Mesh(new THREE.BoxGeometry(22, 8, 6), headlightMaterial);
  const headlightRight = headlightLeft.clone();

  headlightLeft.position.set(-28, 20, 74);
  headlightRight.position.set(28, 20, 74);
  group.add(headlightLeft);
  group.add(headlightRight);

  const codeTexture = createCodeTexture(entity.code);
  const codePlate = new THREE.Mesh(
    new THREE.PlaneGeometry(54, 22),
    new THREE.MeshBasicMaterial({
      map: codeTexture,
      toneMapped: false,
      transparent: true,
    }),
  );

  codePlate.rotation.x = -Math.PI / 2;
  codePlate.position.set(-58, 49, -28);
  group.add(codePlate);

  const statLabel = createCarStatLabel();
  const floorLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(108, 250),
    statLabel.material,
  );

  floorLabel.rotation.x = -Math.PI / 2;
  floorLabel.position.set(0, roadGroundY + 8, 0);
  floorLabel.renderOrder = 24;
  floorLabel.visible = false;

  return {
    boostTrailMaterial,
    bodyAccentMaterial,
    flagTexture,
    floorLabel,
    glowMaterial,
    group,
    headlightMaterial,
    statContext: statLabel.context,
    statMaterial: statLabel.material,
    statSignature: '',
    statTexture: statLabel.texture,
    wheels,
  };
};

const createRoadModel = () => {
  const group = new THREE.Group();
  const roadMaterial = new THREE.MeshStandardMaterial({
    color: 0x131c2e,
    metalness: 0.05,
    roughness: 0.72,
  });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(roadWidth, roadLength), roadMaterial);

  road.rotation.x = -Math.PI / 2;
  road.position.set(0, roadGroundY, roadCenterZ);
  road.receiveShadow = true;
  group.add(road);

  const shoulderMaterial = new THREE.MeshBasicMaterial({
    color: 0x24334d,
    opacity: 0.42,
    transparent: true,
  });

  for (const x of [-roadHalfWidth, roadHalfWidth]) {
    const shoulder = new THREE.Mesh(new THREE.BoxGeometry(8, 2, roadLength), shoulderMaterial);

    shoulder.position.set(x, roadGroundY + 3, roadCenterZ);
    group.add(shoulder);
  }

  const dashes: THREE.Mesh[] = [];
  const dashMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    opacity: 0.35,
    transparent: true,
  });

  for (let divider = 1; divider < physicalLaneCount; divider += 1) {
    const dividerX = laneMinX + laneStep * (divider - 0.5);

    for (let index = 0; index < 13; index += 1) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(7, 2, 66), dashMaterial.clone());

      dash.position.set(dividerX, roadGroundY + 4, -260 + index * 170);
      dashes.push(dash);
      group.add(dash);
    }
  }

  const yearMarkers = raceData.snapshots.map((snapshot) => createYearMarkerModel(snapshot.year, snapshot.monthIndex));

  for (const marker of yearMarkers) {
    group.add(marker.group);
  }

  return { dashes, group, yearMarkers };
};

const createYearMarkerModel = (year: number, monthIndex: number): YearMarkerModel => {
  const group = new THREE.Group();
  const lineMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    opacity: 0.18,
    transparent: true,
  });
  const line = new THREE.Mesh(new THREE.BoxGeometry(roadWidth * 0.92, 2, 5), lineMaterial);

  line.position.set(0, roadGroundY + 5, 0);
  group.add(line);

  const labelTexture = createYearLabelTexture(year);
  const labelMaterial = new THREE.MeshBasicMaterial({
    depthWrite: false,
    map: labelTexture,
    opacity: 0.82,
    toneMapped: false,
    transparent: true,
  });
  const label = new THREE.Mesh(new THREE.PlaneGeometry(86, 30), labelMaterial);

  label.rotation.x = -Math.PI / 2;
  label.position.set(-roadHalfWidth + 60, roadGroundY + 7, -18);
  group.add(label);

  return {
    group,
    materials: [lineMaterial, labelMaterial],
    monthIndex,
  };
};

const createFinishLineModel = (): FinishLineModel => {
  const group = new THREE.Group();
  const materials: THREE.MeshBasicMaterial[] = [];
  const cellCount = 14;
  const cellWidth = (roadWidth * 0.86) / cellCount;
  const cellDepth = 28;
  const startX = -(cellWidth * cellCount) / 2 + cellWidth / 2;

  for (let row = 0; row < 2; row += 1) {
    for (let column = 0; column < cellCount; column += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: (row + column) % 2 === 0 ? 0xffffff : 0x0a1020,
        opacity: 0,
        transparent: true,
      });
      const cell = new THREE.Mesh(new THREE.BoxGeometry(cellWidth, 2, cellDepth), material);

      cell.position.set(startX + column * cellWidth, roadGroundY + 8, row * cellDepth - cellDepth / 2);
      group.add(cell);
      materials.push(material);
    }
  }

  const labelMaterial = new THREE.MeshBasicMaterial({
    depthWrite: false,
    map: createFinishLabelTexture(),
    opacity: 0,
    toneMapped: false,
    transparent: true,
  });
  const label = new THREE.Mesh(new THREE.PlaneGeometry(228, 58), labelMaterial);

  label.rotation.x = -Math.PI / 2;
  label.position.set(0, roadGroundY + 10, -68);
  group.add(label);
  materials.push(labelMaterial);

  group.visible = false;

  return { group, materials };
};

const createWorldCupItemModel = (): WorldCupItemModel => {
  const group = new THREE.Group();
  const goldMaterial = new THREE.MeshPhysicalMaterial({
    clearcoat: 0.88,
    clearcoatRoughness: 0.16,
    color: 0xffd447,
    emissive: 0xffa51f,
    emissiveIntensity: 0.28,
    metalness: 0.72,
    opacity: 0,
    roughness: 0.2,
    transparent: true,
  });
  const darkGoldMaterial = new THREE.MeshPhysicalMaterial({
    clearcoat: 0.55,
    color: 0xbf7a10,
    emissive: 0x6d3f08,
    emissiveIntensity: 0.18,
    metalness: 0.62,
    opacity: 0,
    roughness: 0.24,
    transparent: true,
  });
  const glowMaterial = new THREE.MeshBasicMaterial({
    blending: THREE.AdditiveBlending,
    color: 0xffd447,
    depthWrite: false,
    opacity: 0,
    transparent: true,
  });
  const burstMaterial = new THREE.MeshBasicMaterial({
    blending: THREE.AdditiveBlending,
    color: 0xffffff,
    depthWrite: false,
    opacity: 0,
    transparent: true,
  });
  const sparkMaterial = new THREE.MeshBasicMaterial({
    blending: THREE.AdditiveBlending,
    color: 0xfff0a3,
    depthWrite: false,
    opacity: 0,
    transparent: true,
  });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(22, 28, 12, 28), darkGoldMaterial);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(7, 13, 28, 24), goldMaterial);
  const cup = new THREE.Mesh(new THREE.SphereGeometry(28, 32, 18), goldMaterial);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(25, 3.5, 10, 32), goldMaterial);
  const handleLeft = new THREE.Mesh(new THREE.TorusGeometry(17, 2.8, 8, 28, Math.PI * 1.18), goldMaterial);
  const handleRight = handleLeft.clone();
  const glow = new THREE.Mesh(new THREE.CircleGeometry(58, 36), glowMaterial);
  const burstRing = new THREE.Mesh(new THREE.TorusGeometry(54, 4, 10, 54), burstMaterial);
  const sparks = Array.from({ length: 12 }, (_, index) => {
    const spark = new THREE.Mesh(new THREE.SphereGeometry(4.5 + (index % 3), 8, 6), sparkMaterial);

    spark.visible = false;
    return spark;
  });

  base.position.y = 6;
  stem.position.y = 24;
  cup.scale.set(0.82, 0.98, 0.82);
  cup.position.y = 48;
  lip.position.y = 68;
  lip.rotation.x = Math.PI / 2;
  handleLeft.position.set(-24, 50, 0);
  handleLeft.rotation.z = Math.PI * 0.5;
  handleRight.position.set(24, 50, 0);
  handleRight.rotation.z = -Math.PI * 0.5;
  handleRight.scale.x = -1;
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 1;
  burstRing.rotation.x = Math.PI / 2;
  burstRing.position.y = 12;

  group.add(glow);
  group.add(burstRing);
  group.add(base);
  group.add(stem);
  group.add(cup);
  group.add(lip);
  group.add(handleLeft);
  group.add(handleRight);
  for (const spark of sparks) {
    group.add(spark);
  }
  group.visible = false;

  return {
    burstMaterial,
    burstRing,
    glowMaterial,
    group,
    materials: [goldMaterial, darkGoldMaterial, glowMaterial, burstMaterial, sparkMaterial],
    sparkMaterial,
    sparks,
  };
};

const createSpeedStars = () => {
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    opacity: 0.76,
    transparent: true,
  });

  return Array.from({ length: 80 }, (_, index) => {
    const star = new THREE.Mesh(
      new THREE.SphereGeometry(1.8 + seededRandom(index + 1) * 3.6, 8, 6),
      material.clone(),
    );

    star.position.set(
      -640 + seededRandom(index + 7) * 1280,
      80 + seededRandom(index + 13) * 760,
      -500 + seededRandom(index + 19) * 2200,
    );

    return star;
  });
};

const updateRoadDashes = (dashes: THREE.Mesh[], frame: number) => {
  for (let index = 0; index < dashes.length; index += 1) {
    const dash = dashes[index];
    const z = -400 + positiveModulo(index * 155 - frame * 24, 2120);
    const material = dash.material as THREE.MeshBasicMaterial;

    dash.position.z = z;
    material.opacity = 0.15 + clamp((z + 400) / 1000, 0, 1) * 0.3;
  }
};

const updateYearMarkers = (markers: YearMarkerModel[], progress: number) => {
  for (const marker of markers) {
    const markerZ = yearMarkerZForMonthIndex(marker.monthIndex, progress);
    const fadeIn = clamp((markerZ + 440) / 300, 0, 1);
    const fadeOut = clamp((1900 - markerZ) / 420, 0, 1);
    const opacity = fadeIn * fadeOut;

    marker.group.visible = opacity > 0.015;
    marker.group.position.set(0, 0, markerZ);
    marker.materials[0].opacity = 0.2 * opacity;
    marker.materials[1].opacity = 0.82 * opacity;
  }
};

const updateSpeedStars = (stars: THREE.Mesh[], frame: number) => {
  for (let index = 0; index < stars.length; index += 1) {
    const star = stars[index];
    const z = -760 + positiveModulo(index * 89 - frame * (22 + (index % 5) * 3), 2450);
    const material = star.material as THREE.MeshBasicMaterial;

    star.position.z = z;
    material.opacity = 0.22 + clamp((z + 760) / 1300, 0, 1) * 0.54;
  }
};

const updateFinishLine = (finishLine: FinishLineModel, progress: number) => {
  const finishZ = yearMarkerZForMonthIndex(raceData.maxMonthIndex, progress) - 130;
  const endReveal = smootherStep(clamp((progress - 0.83) / 0.15, 0, 1));
  const nearRoadFade = clamp((finishZ + 520) / 420, 0, 1) *
    clamp((1950 - finishZ) / 520, 0, 1);
  const opacity = endReveal * nearRoadFade;

  finishLine.group.visible = opacity > 0.012;
  finishLine.group.position.set(0, 0, finishZ);

  for (const material of finishLine.materials) {
    material.opacity = (material.map ? 0.92 : 0.88) * opacity;
  }
};

const updateWorldCupItem = (
  item: WorldCupItemModel,
  state: WorldCupWinnerFrameState,
  layouts: Map<string, RallyLayout>,
  frame: number,
) => {
  const targetLayout = layouts.get(state.incomingWinnerCode);
  const shouldBoost =
    targetLayout !== undefined &&
    targetLayout.previousRank > targetLayout.targetRank &&
    state.segmentProgress >= 0.05 &&
    state.segmentProgress <= 0.86;

  if (!targetLayout || !shouldBoost) {
    item.group.visible = false;
    setWorldCupItemOpacity(item, 0);
    item.burstMaterial.opacity = 0;
    item.sparkMaterial.opacity = 0;
    item.burstRing.visible = false;
    for (const spark of item.sparks) {
      spark.visible = false;
    }
    return;
  }

  const approach = smootherStep(clamp((state.segmentProgress - 0.16) / 0.36, 0, 1));
  const collect = smootherStep(clamp((state.segmentProgress - 0.52) / 0.08, 0, 1));
  const appear = smootherStep(clamp((state.segmentProgress - 0.1) / 0.14, 0, 1));
  const burst = Math.sin(clamp((state.segmentProgress - 0.52) / 0.34, 0, 1) * Math.PI);
  const opacity = appear * (1 - collect);
  const itemZ = targetLayout.baseRoadZ + THREE.MathUtils.lerp(840, 18, approach);
  const baseScale = 0.44 + approach * 0.11;

  item.group.visible = opacity > 0.012 || burst > 0.012;
  item.group.position.set(
    targetLayout.laneX,
    roadGroundY + 7 + Math.sin(frame * 0.18) * 2,
    itemZ,
  );
  item.group.rotation.set(
    THREE.MathUtils.degToRad(8),
    frame * 0.13,
    THREE.MathUtils.degToRad(-5),
  );
  item.group.scale.setScalar(baseScale * (1 - collect * 0.55));
  setWorldCupItemOpacity(item, opacity);
  item.glowMaterial.opacity = opacity * (0.1 + approach * 0.16);
  item.burstRing.visible = burst > 0.012;
  item.burstRing.scale.setScalar(0.55 + burst * 3.7);
  item.burstMaterial.opacity = burst * 0.95;
  item.sparkMaterial.opacity = burst * 0.86;

  for (let index = 0; index < item.sparks.length; index += 1) {
    const spark = item.sparks[index];
    const angle = (Math.PI * 2 * index) / item.sparks.length + frame * 0.035;
    const radius = 32 + burst * (58 + (index % 4) * 16);

    spark.visible = burst > 0.02;
    spark.position.set(
      Math.cos(angle) * radius,
      28 + burst * (14 + (index % 3) * 9),
      Math.sin(angle) * radius,
    );
    spark.scale.setScalar(1 + burst * 1.35);
  }
};

const setWorldCupItemOpacity = (item: WorldCupItemModel, opacity: number) => {
  for (const material of item.materials) {
    material.opacity = opacity;
    material.transparent = opacity < 0.999;
  }
};

const renderThreeFrame = (
  handle: ThreeRallyHandle,
  state: WorldCupWinnerFrameState,
  frame: number,
  progress: number,
) => {
  const sceneRows = state.rows.filter((raceRow) =>
    raceRow.displayRank <= topN || (
      raceRow.id === state.incomingWinnerCode &&
      rankForValueKey(raceRow, state.rows, 'previousValue') !==
        rankForValueKey(raceRow, state.rows, 'targetValue')
    )
  );
  const activeRows = new Map(sceneRows.map((raceRow) => [raceRow.id, raceRow]));
  const layouts = new Map<string, RallyLayout>();

  for (const raceRow of sceneRows) {
    layouts.set(raceRow.id, layoutForRaceRow(raceRow, state, frame));
  }

  const activeBoostPower = Math.max(0, ...[...layouts.values()].map((layout) => layout.boostPower));

  for (const [id, car] of handle.cars.entries()) {
    const raceRow = activeRows.get(id);
    const layout = layouts.get(id);

    if (!raceRow || !layout) {
      car.group.visible = false;
      car.floorLabel.visible = false;
      continue;
    }

    const eventPower = raceRow.id === state.incomingWinnerCode && layout.previousRank > layout.targetRank
      ? passBoostPower(state.segmentProgress)
      : 0;
    const bodyColor = solidColorFor(raceRow);

    car.group.visible = true;
    car.group.position.set(
      layout.laneX,
      -13,
      layout.roadZ,
    );
    car.group.rotation.set(layout.pitch, layout.yaw, layout.roll);
    car.group.scale.setScalar(layout.scale);
    car.bodyAccentMaterial.color.set(bodyColor);
    car.bodyAccentMaterial.emissive.set(bodyColor);
    car.bodyAccentMaterial.emissiveIntensity = 0.12 + eventPower * 0.26;
    car.glowMaterial.color.set(bodyColor);
    car.glowMaterial.opacity = 0.12 * layout.opacity + eventPower * 0.24;
    car.headlightMaterial.opacity = 0.62 + eventPower * 0.24;
    car.boostTrailMaterial.color.set(bodyColor);
    car.boostTrailMaterial.opacity = eventPower * 0.62;
    updateCarStatLabel(car, raceRow, layout.opacity);
    car.floorLabel.visible = layout.opacity > 0.04;
    car.floorLabel.position.set(
      layout.laneX,
      roadGroundY + 9,
      layout.baseRoadZ + 170,
    );
    car.floorLabel.rotation.set(-Math.PI / 2, 0, 0);

    for (const wheel of car.wheels) {
      wheel.rotation.x += 0.34 + eventPower * 0.72;
    }
  }

  updateRoadDashes(handle.roadDashes, frame);
  updateYearMarkers(handle.yearMarkers, progress);
  updateSpeedStars(handle.speedStars, frame);
  updateFinishLine(handle.finishLine, progress);
  updateWorldCupItem(handle.worldCupItem, state, layouts, frame);

  setRallyCamera(
    handle.camera,
    new THREE.Vector3(
      -1180 + Math.sin(frame * 0.018) * 7 - activeBoostPower * 22,
      1180 + Math.sin(frame * 0.014) * 5 - activeBoostPower * 14,
      150 + Math.sin(frame * 0.012) * 5 + activeBoostPower * 48,
    ),
    new THREE.Vector3(-55, 50 + activeBoostPower * 8, 710 + activeBoostPower * 72),
  );
  handle.renderer.clear();
  handle.renderer.render(handle.scene, handle.camera);
};

const layoutForRaceRow = (
  raceRow: WorldCupWinnerRaceRow,
  state: WorldCupWinnerFrameState,
  frame: number,
): RallyLayout => {
  const previousRank = rankForValueKey(raceRow, state.rows, 'previousValue');
  const targetRank = rankForValueKey(raceRow, state.rows, 'targetValue');
  const laneX = laneXForRaceRow(raceRow) +
    Math.sin(frame * 0.025 + hashText(raceRow.id) * 0.01) * 1.2;
  const isRankChangingWinner =
    raceRow.id === state.incomingWinnerCode && previousRank > targetRank;
  const boostPower = isRankChangingWinner ? passBoostPower(state.segmentProgress) : 0;
  const baseRoadZ = 250 + raceRow.value * 130 + tieRoadOffsetForRaceRow(raceRow, state.rows);
  const roadZ = baseRoadZ + boostPower * 185;
  const pitch = -boostPower * 0.16;
  const roll =
    Math.sin(frame * 0.036 + raceRow.liveRank * 0.8) * 0.018 +
    boostPower * 0.07;
  const yaw = Math.sin(frame * 0.021 + raceRow.liveRank) * 0.026 -
    boostPower * 0.035;

  return {
    baseRoadZ,
    boostPower,
    laneX,
    opacity: raceRow.opacity,
    pitch,
    previousRank,
    roadZ,
    roll,
    scale: 0.54 + (topN - Math.min(topN, raceRow.liveRank)) * 0.008,
    targetRank,
    yaw,
  };
};

const setRallyCamera = (
  camera: THREE.PerspectiveCamera,
  position: THREE.Vector3,
  target: THREE.Vector3,
) => {
  camera.position.copy(position);
  camera.lookAt(target);
  camera.rotateZ(rallyCameraRoll);
};

type RankValueKey = 'previousValue' | 'targetValue';

const rankForValueKey = (
  raceRow: WorldCupWinnerRaceRow,
  rows: WorldCupWinnerRaceRow[],
  valueKey: RankValueKey,
) => {
  if (raceRow.previousValue <= 0.001 && raceRow.targetValue <= 0.001) {
    return topN + 1;
  }

  let rank = 1;

  for (const other of rows) {
    if (
      other.id === raceRow.id ||
      (other.previousValue <= 0.001 && other.targetValue <= 0.001)
    ) {
      continue;
    }

    if (compareRaceRowByValue(other, raceRow, valueKey) < 0) {
      rank += 1;
    }
  }

  return clamp(rank, 1, topN + 1);
};

const compareRaceRowByValue = (
  a: WorldCupWinnerRaceRow,
  b: WorldCupWinnerRaceRow,
  valueKey: RankValueKey,
) => b[valueKey] - a[valueKey] || a.name.localeCompare(b.name);

const laneXForLaneIndex = (laneIndex: number, laneCount: number) =>
  THREE.MathUtils.lerp(
    laneMinX,
    laneMaxX,
    clamp(laneIndex / Math.max(1, laneCount - 1), 0, 1),
  );

const laneXForRaceRow = (raceRow: WorldCupWinnerRaceRow) => {
  const stableLaneIndex = stableLaneIndexByCode.get(raceRow.id) ?? 0;

  return laneXForLaneIndex(stableLaneIndex, stableLaneCodes.length);
};

const tieRoadOffsetForRaceRow = (
  raceRow: WorldCupWinnerRaceRow,
  rows: WorldCupWinnerRaceRow[],
) => {
  const titleBucket = Math.max(0, Math.round(raceRow.value));
  const tiedRows = rows
    .filter((row) => Math.max(0, Math.round(row.value)) === titleBucket && row.value > 0.001)
    .sort((rowA, rowB) =>
      (stableLaneIndexByCode.get(rowA.id) ?? 0) - (stableLaneIndexByCode.get(rowB.id) ?? 0) ||
      rowA.name.localeCompare(rowB.name)
    );
  const tieIndex = Math.max(0, tiedRows.findIndex((row) => row.id === raceRow.id));

  return (tieIndex - (tiedRows.length - 1) / 2) * 56;
};

const progressForMonthIndex = (monthIndex: number) =>
  (monthIndex - raceData.minMonthIndex) /
  Math.max(1, raceData.maxMonthIndex - raceData.minMonthIndex);

const yearMarkerZForMonthIndex = (monthIndex: number, progress: number) =>
  yearMarkerHitZ + (progressForMonthIndex(monthIndex) - progress) * yearTrackLengthZ;

const passBoostPower = (segmentProgress: number) => {
  const attack = smootherStep(clamp((segmentProgress - 0.56) / 0.14, 0, 1));
  const release = 1 - smootherStep(clamp((segmentProgress - 0.78) / 0.18, 0, 1));

  return attack * release;
};

const RaceHud = ({
  progress,
  state,
}: {
  progress: number;
  state: WorldCupWinnerFrameState;
}) => {
  const leader = state.rows.find((raceRow) => raceRow.displayRank === 1) ?? state.rows[0];
  const topRows = state.rows.slice(0, topN);

  return (
    <>
      <div style={styles.eventPill}>
        <span style={styles.eventPillCup}>CUP</span>
        <span style={styles.eventPillText}>{formatWorldCupName(state.host)}</span>
      </div>
      {leader ? (
        <div style={styles.leaderChip}>
          <div style={{ ...styles.leaderSwatch, background: solidColorFor(leader) }} />
          <div>
            <div style={styles.leaderLabel}>LEADER</div>
            <div style={styles.leaderName}>{leader.name}</div>
          </div>
          <div style={styles.leaderValue}>{formatTitles(leader.value)}</div>
        </div>
      ) : null}
      <div style={styles.rankPanel}>
        {topRows.map((raceRow) => (
          <div key={`rank-${raceRow.id}`} style={styles.rankRow}>
            <div style={{ ...styles.rankNumber, color: rankColorFor(raceRow.displayRank) }}>
              {raceRow.displayRank}
            </div>
            <div style={{ ...styles.rankDot, background: solidColorFor(raceRow) }} />
            <div style={styles.rankName}>{raceRow.name}</div>
            <div style={styles.rankValue}>{formatTitles(raceRow.value)}</div>
          </div>
        ))}
      </div>
      <div style={styles.progressRail}>
        <div style={{ ...styles.progressFill, width: `${clamp(progress, 0, 1) * 100}%` }} />
        <div style={styles.progressYears}>
          <span>{raceData.minYear}</span>
          <span>{raceData.maxYear}</span>
        </div>
      </div>
    </>
  );
};

const SpaceBackground = ({ frame }: { frame: number }) => {
  const stars = useMemo(() => starField, []);

  return (
    <AbsoluteFill style={styles.spaceBackground}>
      <div style={styles.deepSpaceWash} />
      {stars.map((star) => {
        const drift = ((frame * star.speed) % 140) - 70;

        return (
          <div
            key={star.id}
            style={{
              ...styles.star,
              height: star.size,
              left: star.x - drift * 0.58,
              opacity: star.opacity,
              top: star.y + drift,
              width: star.size,
            }}
          />
        );
      })}
      <div style={styles.speedBand} />
      <div style={styles.vignette} />
      <div style={styles.scanlines} />
    </AbsoluteFill>
  );
};

const RallyTrackGlow = () => (
  <AbsoluteFill style={styles.trackGlowLayer}>
    <div style={styles.trackCoreGlow} />
  </AbsoluteFill>
);

const DiagonalTitle = ({ state }: { state: WorldCupWinnerFrameState }) => (
  <div style={styles.diagonalTitle}>
    <div style={styles.diagonalTitleMain}>WORLD CUP WINNERS</div>
    <div style={styles.diagonalTitleYear}>{state.year}</div>
  </div>
);

const Footer = () => (
  <div style={styles.footer}>
    <div style={styles.channel}>{channelHandle}</div>
    <div style={styles.source}>
      {worldCupWinnersRaceVideoConfig.source} · Car model: Kenney Car Kit CC0
    </div>
  </div>
);

const createFlagTexture = (code: string) => {
  const canvas = document.createElement('canvas');
  const width = 512;
  const height = 320;

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Could not create flag texture context');
  }

  context.save();
  drawRoundedRect(context, 0, 0, width, height, 54);
  context.clip();
  drawFlagPattern(context, code, width, height);
  context.restore();

  context.save();
  context.strokeStyle = 'rgba(255,255,255,0.88)';
  context.lineWidth = 16;
  drawRoundedRect(context, 8, 8, width - 16, height - 16, 46);
  context.stroke();
  context.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  return texture;
};

const createCodeTexture = (code: string) => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Could not create code texture context');
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(3,7,18,0.72)';
  drawRoundedRect(context, 0, 0, canvas.width, canvas.height, 22);
  context.fill();
  context.strokeStyle = 'rgba(255,255,255,0.48)';
  context.lineWidth = 5;
  context.stroke();
  context.fillStyle = '#FFFFFF';
  context.font = '900 46px Arial, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(code, canvas.width / 2, canvas.height / 2 + 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  return texture;
};

const createCarStatLabel = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 640;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Could not create car stat label texture context');
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  const material = new THREE.MeshBasicMaterial({
    depthTest: false,
    depthWrite: false,
    map: texture,
    opacity: 0,
    side: THREE.DoubleSide,
    toneMapped: false,
    transparent: true,
  });

  return { canvas, context, material, texture };
};

const updateCarStatLabel = (
  car: CountryCarModel,
  raceRow: WorldCupWinnerRaceRow,
  opacity: number,
) => {
  const signature = `${raceRow.displayRank}:${Math.round(raceRow.value)}`;
  const canvas = car.statContext.canvas;
  const width = canvas.width;
  const height = canvas.height;
  const cupCount = Math.round(raceRow.value);

  car.statMaterial.opacity = 0.82 * opacity;

  if (car.statSignature === signature) {
    return;
  }

  car.statSignature = signature;
  car.statContext.clearRect(0, 0, width, height);
  car.statContext.fillStyle = 'rgba(5, 10, 22, 0.78)';
  drawRoundedRect(car.statContext, 28, 28, width - 56, height - 56, 42);
  car.statContext.fill();
  car.statContext.strokeStyle = solidColorFor(raceRow);
  car.statContext.lineWidth = 13;
  car.statContext.stroke();

  car.statContext.fillStyle = 'rgba(255,255,255,0.18)';
  car.statContext.fillRect(width / 2 - 4, 72, 8, height - 144);

  car.statContext.fillStyle = '#FFD447';
  car.statContext.font = '900 92px Arial, sans-serif';
  car.statContext.textAlign = 'center';
  car.statContext.textBaseline = 'middle';
  car.statContext.fillText(`#${raceRow.displayRank}`, width / 2, 128);

  car.statContext.fillStyle = '#FFFFFF';
  car.statContext.font = '900 82px Arial, sans-serif';
  car.statContext.fillText(raceRow.code, width / 2, 288);

  car.statContext.fillStyle = '#FFD447';
  car.statContext.font = '900 112px Arial, sans-serif';
  car.statContext.fillText(String(cupCount), width / 2, 448);

  car.statContext.fillStyle = 'rgba(255,255,255,0.78)';
  car.statContext.font = '900 40px Arial, sans-serif';
  car.statContext.fillText(cupCount === 1 ? 'CUP' : 'CUPS', width / 2, 532);
  car.statTexture.needsUpdate = true;
};

const createBoostTrailTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 512;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Could not create boost trail texture context');
  }

  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(255,255,255,0)');
  gradient.addColorStop(0.18, 'rgba(255,255,255,0.92)');
  gradient.addColorStop(0.48, 'rgba(255,212,71,0.62)');
  gradient.addColorStop(1, 'rgba(255,96,24,0)');

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = gradient;
  context.beginPath();
  context.moveTo(canvas.width / 2, 0);
  context.bezierCurveTo(canvas.width * 0.9, 140, canvas.width * 0.78, 340, canvas.width / 2, canvas.height);
  context.bezierCurveTo(canvas.width * 0.22, 340, canvas.width * 0.1, 140, canvas.width / 2, 0);
  context.closePath();
  context.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  return texture;
};

const createYearLabelTexture = (year: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Could not create year label texture context');
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(8,15,29,0.68)';
  drawRoundedRect(context, 18, 18, canvas.width - 36, canvas.height - 36, 18);
  context.fill();
  context.strokeStyle = 'rgba(255,255,255,0.26)';
  context.lineWidth = 4;
  context.stroke();
  context.fillStyle = 'rgba(255,255,255,0.9)';
  context.font = '900 42px Arial, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(String(year), canvas.width / 2, canvas.height / 2 + 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  return texture;
};

const createFinishLabelTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Could not create finish label texture context');
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(8,15,29,0.76)';
  drawRoundedRect(context, 22, 28, canvas.width - 44, canvas.height - 56, 24);
  context.fill();
  context.strokeStyle = 'rgba(255,255,255,0.72)';
  context.lineWidth = 7;
  context.stroke();
  context.fillStyle = '#FFFFFF';
  context.font = '900 86px Arial, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('FINISH', canvas.width / 2, canvas.height / 2 + 6);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  return texture;
};

const drawFlagPattern = (
  context: CanvasRenderingContext2D,
  code: string,
  width: number,
  height: number,
) => {
  if (code === 'BRA') {
    context.fillStyle = '#009B3A';
    context.fillRect(0, 0, width, height);
    context.fillStyle = '#FFDF00';
    context.beginPath();
    context.moveTo(width / 2, 34);
    context.lineTo(width - 46, height / 2);
    context.lineTo(width / 2, height - 34);
    context.lineTo(46, height / 2);
    context.closePath();
    context.fill();
    context.fillStyle = '#002776';
    context.beginPath();
    context.arc(width / 2, height / 2, 68, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#FFFFFF';
    context.lineWidth = 14;
    context.beginPath();
    context.ellipse(width / 2, height / 2 + 6, 78, 20, -0.22, Math.PI * 1.05, Math.PI * 1.93);
    context.stroke();
    return;
  }

  if (code === 'GER') {
    stripeRows(context, width, height, ['#000000', '#DD0000', '#FFCE00']);
    return;
  }

  if (code === 'ITA') {
    stripeColumns(context, width, height, ['#009246', '#FFFFFF', '#CE2B37']);
    return;
  }

  if (code === 'ARG') {
    stripeRows(context, width, height, ['#74ACDF', '#FFFFFF', '#74ACDF']);
    context.fillStyle = '#F6B40E';
    context.beginPath();
    context.arc(width / 2, height / 2, 30, 0, Math.PI * 2);
    context.fill();
    return;
  }

  if (code === 'FRA') {
    stripeColumns(context, width, height, ['#0055A4', '#FFFFFF', '#EF4135']);
    return;
  }

  if (code === 'URU') {
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, width, height);

    for (let index = 1; index < 9; index += 2) {
      context.fillStyle = '#0038A8';
      context.fillRect(0, (height / 9) * index, width, height / 9);
    }

    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, width * 0.42, height * 0.56);
    context.fillStyle = '#FCD116';
    context.beginPath();
    context.arc(width * 0.21, height * 0.28, 34, 0, Math.PI * 2);
    context.fill();
    return;
  }

  if (code === 'ENG') {
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, width, height);
    context.fillStyle = '#CE1124';
    context.fillRect(width / 2 - 34, 0, 68, height);
    context.fillRect(0, height / 2 - 34, width, 68);
    return;
  }

  if (code === 'ESP') {
    context.fillStyle = '#AA151B';
    context.fillRect(0, 0, width, height);
    context.fillStyle = '#F1BF00';
    context.fillRect(0, height * 0.25, width, height * 0.5);
    context.fillStyle = '#B48A16';
    context.fillRect(width * 0.22, height * 0.39, 42, 70);
    context.strokeStyle = '#AA151B';
    context.lineWidth = 8;
    context.strokeRect(width * 0.22, height * 0.39, 42, 70);
    return;
  }

  context.fillStyle = '#111827';
  context.fillRect(0, 0, width, height);
};

const stripeRows = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  colors: string[],
) => {
  colors.forEach((color, index) => {
    context.fillStyle = color;
    context.fillRect(0, (height / colors.length) * index, width, height / colors.length);
  });
};

const stripeColumns = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  colors: string[],
) => {
  colors.forEach((color, index) => {
    context.fillStyle = color;
    context.fillRect((width / colors.length) * index, 0, width / colors.length, height);
  });
};

const drawRoundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  const r = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
};

const disposeObject = (object: THREE.Object3D) => {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;

    if (mesh.geometry) {
      mesh.geometry.dispose();
    }

    if (mesh.material) {
      disposeMaterial(mesh.material);
    }
  });
};

const disposeMaterial = (material: THREE.Material | THREE.Material[]) => {
  const materials = Array.isArray(material) ? material : [material];

  for (const item of materials) {
    const maybeMap = item as THREE.Material & { map?: THREE.Texture };

    maybeMap.map?.dispose();
    item.dispose();
  }
};

const formatTitles = (value: number) => `${Math.max(0, Math.round(value))}`;

const formatWorldCupName = (host: string) => host ? `${host} World Cup` : 'FIFA World Cup';

const solidColorFor = (raceRow: Pick<WorldCupWinnerRaceRow, 'color' | 'id'>) =>
  normalizeHexColor(raceRow.color) ?? flatPalette[Math.abs(hashText(raceRow.id)) % flatPalette.length];

const rankColorFor = (rank: number) => {
  if (rank === 1) {
    return '#FFD447';
  }

  if (rank === 2) {
    return '#DCE8F5';
  }

  if (rank === 3) {
    return '#F59E0B';
  }

  return '#FFFFFF';
};

const normalizeHexColor = (color: string) => /^#[0-9A-Fa-f]{6}$/.test(color) ? color : undefined;

const hashText = (text: string) => {
  let hash = 0;

  for (const char of text) {
    hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  }

  return hash;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const smootherStep = (value: number) => {
  const t = clamp(value, 0, 1);

  return t * t * t * (t * (t * 6 - 15) + 10);
};

const positiveModulo = (value: number, divisor: number) => ((value % divisor) + divisor) % divisor;

const seededRandom = (seed: number) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;

  return value - Math.floor(value);
};

const starField = Array.from({ length: 150 }, (_, index) => ({
  id: `star-${index}`,
  opacity: 0.34 + seededRandom(index + 11) * 0.58,
  size: 2 + seededRandom(index + 23) * 4.8,
  speed: 0.12 + seededRandom(index + 37) * 0.5,
  x: Math.round(seededRandom(index + 3) * VIDEO_WIDTH),
  y: Math.round(seededRandom(index + 7) * VIDEO_HEIGHT),
}));

const flatPalette = [
  '#22C55E',
  '#FACC15',
  '#2563EB',
  '#38BDF8',
  '#4F46E5',
  '#67E8F9',
  '#DC2626',
  '#F97316',
] as const;

const styles: Record<string, CSSProperties> = {
  channel: {
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.22)',
    borderRadius: 999,
    color: 'rgba(255,255,255,0.82)',
    fontSize: 22,
    fontWeight: 900,
    lineHeight: 1,
    padding: '8px 13px',
  },
  deepSpaceWash: {
    background:
      'radial-gradient(circle at 72% 53%, rgba(25,84,151,0.18), rgba(12,22,38,0) 36%), radial-gradient(circle at 16% 18%, rgba(77,124,255,0.12), rgba(10,20,34,0) 32%), linear-gradient(180deg, #101B2F 0%, #0D1829 46%, #08101F 100%)',
    inset: 0,
    position: 'absolute',
  },
  diagonalTitle: {
    color: '#FFFFFF',
    filter: 'drop-shadow(0 0 18px rgba(95,166,255,0.54)) drop-shadow(0 16px 22px rgba(0,0,0,0.5))',
    fontFamily: fontStack,
    fontStyle: 'italic',
    fontWeight: 950,
    left: 20,
    lineHeight: 0.88,
    position: 'absolute',
    textAlign: 'center',
    textTransform: 'uppercase',
    top: 210,
    transform: 'rotate(-35deg)',
    transformOrigin: 'center',
    width: 1040,
    zIndex: 7,
  },
  diagonalTitleMain: {
    fontSize: 74,
    letterSpacing: 0,
    whiteSpace: 'nowrap',
    WebkitTextStroke: '3px rgba(255,255,255,0.2)',
  },
  diagonalTitleYear: {
    fontSize: 118,
    letterSpacing: 0,
    marginTop: 18,
    WebkitTextStroke: '3px rgba(255,255,255,0.22)',
  },
  eventPill: {
    alignItems: 'center',
    background: 'rgba(6,13,26,0.66)',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: 999,
    boxShadow: '0 16px 38px rgba(0,0,0,0.24), inset 0 0 0 1px rgba(255,255,255,0.06)',
    color: '#FFFFFF',
    display: 'flex',
    gap: 12,
    left: 72,
    maxWidth: 610,
    overflow: 'hidden',
    padding: '13px 18px',
    position: 'absolute',
    top: 92,
    zIndex: 8,
  },
  eventPillCup: {
    background: 'rgba(255,212,71,0.22)',
    border: '1px solid rgba(255,212,71,0.44)',
    borderRadius: 999,
    color: accentGold,
    fontSize: 22,
    fontWeight: 950,
    lineHeight: 1,
    padding: '7px 10px',
  },
  eventPillText: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 28,
    fontStyle: 'italic',
    fontWeight: 950,
    lineHeight: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  footer: {
    alignItems: 'flex-end',
    bottom: 24,
    color: 'rgba(255,255,255,0.54)',
    display: 'flex',
    fontFamily: fontStack,
    gap: 18,
    justifyContent: 'space-between',
    left: 72,
    position: 'absolute',
    right: 72,
    zIndex: 8,
  },
  leaderChip: {
    alignItems: 'center',
    background: 'rgba(5,10,20,0.62)',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: 8,
    boxShadow: '0 16px 38px rgba(0,0,0,0.22), inset 0 0 0 1px rgba(255,255,255,0.06)',
    boxSizing: 'border-box',
    color: '#FFFFFF',
    display: 'grid',
    gap: 14,
    gridTemplateColumns: '10px 1fr auto',
    height: 82,
    left: 72,
    padding: '12px 16px',
    position: 'absolute',
    top: 1230,
    width: 432,
    zIndex: 8,
  },
  leaderLabel: {
    color: 'rgba(255,255,255,0.52)',
    fontSize: 18,
    fontWeight: 950,
    lineHeight: 1,
  },
  leaderName: {
    color: '#FFFFFF',
    fontSize: 33,
    fontStyle: 'italic',
    fontWeight: 950,
    lineHeight: 1.1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  leaderSwatch: {
    borderRadius: 999,
    height: 54,
    width: 10,
  },
  leaderValue: {
    color: accentGold,
    fontSize: 52,
    fontWeight: 950,
    lineHeight: 1,
    textShadow: '0 0 16px rgba(255,212,71,0.42)',
  },
  progressFill: {
    background: `linear-gradient(90deg, ${accentGold}, #FFFFFF)`,
    borderRadius: 999,
    height: 8,
    left: 0,
    position: 'absolute',
    top: 0,
  },
  progressRail: {
    background: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    height: 8,
    left: 72,
    position: 'absolute',
    right: 72,
    top: 1804,
    zIndex: 9,
  },
  progressYears: {
    color: 'rgba(255,255,255,0.62)',
    display: 'flex',
    fontSize: 22,
    fontWeight: 900,
    justifyContent: 'space-between',
    left: 0,
    position: 'absolute',
    right: 0,
    top: -34,
  },
  rankDot: {
    borderRadius: 999,
    height: 12,
    width: 12,
  },
  rankName: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 21,
    fontWeight: 900,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  rankNumber: {
    fontSize: 23,
    fontWeight: 950,
    textAlign: 'right',
  },
  rankPanel: {
    background: 'rgba(5,10,20,0.54)',
    border: '1px solid rgba(255,255,255,0.16)',
    borderRadius: 8,
    bottom: 154,
    boxShadow: '0 18px 44px rgba(0,0,0,0.22), inset 0 0 0 1px rgba(255,255,255,0.05)',
    boxSizing: 'border-box',
    display: 'grid',
    gap: 9,
    padding: '14px 16px',
    position: 'absolute',
    right: 72,
    width: 360,
    zIndex: 8,
  },
  rankRow: {
    alignItems: 'center',
    display: 'grid',
    gap: 10,
    gridTemplateColumns: '26px 12px 1fr 34px',
    minWidth: 0,
  },
  rankValue: {
    color: accentGold,
    fontSize: 25,
    fontWeight: 950,
    textAlign: 'right',
  },
  scanlines: {
    backgroundImage: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.024) 0 1px, transparent 1px 6px)',
    inset: 0,
    opacity: 0.28,
    position: 'absolute',
  },
  source: {
    fontSize: 18,
    fontWeight: 760,
    lineHeight: 1.28,
    maxWidth: 790,
    textAlign: 'right',
  },
  spaceBackground: {
    backgroundColor: '#0B1424',
    overflow: 'hidden',
    zIndex: 0,
  },
  speedBand: {
    background:
      'linear-gradient(125deg, rgba(116,172,223,0) 0%, rgba(116,172,223,0.12) 42%, rgba(255,255,255,0.12) 50%, rgba(255,212,71,0.1) 58%, rgba(255,212,71,0) 100%)',
    filter: 'blur(10px)',
    height: 360,
    left: -200,
    opacity: 0.54,
    position: 'absolute',
    top: 900,
    transform: 'rotate(-35deg)',
    width: 1440,
  },
  stage: {
    backgroundColor: '#0B1424',
    fontFamily: fontStack,
    overflow: 'hidden',
  },
  star: {
    background: '#FFFFFF',
    borderRadius: '50%',
    boxShadow: '0 0 8px rgba(255,255,255,0.64)',
    position: 'absolute',
  },
  threeCanvas: {
    height: VIDEO_HEIGHT,
    inset: 0,
    position: 'absolute',
    width: VIDEO_WIDTH,
    zIndex: 4,
  },
  trackCoreGlow: {
    background:
      'linear-gradient(90deg, rgba(255,255,255,0), rgba(113,180,255,0.2), rgba(255,255,255,0.12), rgba(255,212,71,0))',
    borderRadius: 999,
    filter: 'blur(24px)',
    height: 240,
    left: -210,
    opacity: 0.78,
    position: 'absolute',
    top: 1020,
    transform: 'rotate(-35deg)',
    width: 1480,
  },
  trackGlowLayer: {
    pointerEvents: 'none',
    zIndex: 1,
  },
  trophyGlow: {
    background:
      'radial-gradient(circle, rgba(255,224,92,0.34) 0%, rgba(255,224,92,0.18) 22%, rgba(255,224,92,0) 66%)',
    borderRadius: '50%',
    filter: 'blur(4px)',
    height: 300,
    left: 575,
    position: 'absolute',
    top: 735,
    width: 300,
  },
  vignette: {
    background:
      'radial-gradient(circle at 50% 45%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.08) 48%, rgba(0,0,0,0.52) 100%)',
    inset: 0,
    position: 'absolute',
  },
};
