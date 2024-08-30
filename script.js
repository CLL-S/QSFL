let scene, camera, renderer, controls, currentModel;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);  // 设置浅灰色背景
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.physicallyCorrectLights = true;  // 使用物理正确的光照模式
    renderer.toneMapping = THREE.ACESFilmicToneMapping;  // 使用ACES Filmic色调映射
    renderer.toneMappingExposure = 1.0;  // 调整曝光
    renderer.outputEncoding = THREE.sRGBEncoding;  // 使用sRGB颜色空间
    document.getElementById('model-container').appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2;

    // 增强环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    // 添加多个平行光源
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(1, 1, 1);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight2.position.set(-1, -1, -1);
    scene.add(directionalLight2);

    const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight3.position.set(0, 1, -1);
    scene.add(directionalLight3);

    // 添加半球光
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
    hemiLight.color.setHSL(0.6, 1, 0.6);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    camera.position.z = 5;

    window.addEventListener('resize', onWindowResize, false);

    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

function loadModel(modelPath) {
    const loader = new THREE.GLTFLoader();
    loader.load(
        `models/${modelPath}`,
        function (gltf) {
            if (currentModel) {
                scene.remove(currentModel);
            }
            currentModel = gltf.scene;
            scene.add(currentModel);

            // 为模型添加环境遮蔽（Ambient Occlusion）
            const aoMap = new THREE.TextureLoader().load('path_to_ao_texture.jpg');
            currentModel.traverse((child) => {
                if (child.isMesh) {
                    child.material.aoMap = aoMap;
                    child.material.aoMapIntensity = 1;
                }
            });

            const box = new THREE.Box3().setFromObject(currentModel);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = camera.fov * (Math.PI / 180);
            let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

            camera.position.z = cameraZ * 1.5;
            const minZ = box.min.z;
            const cameraToFarEdge = minZ < 0 ? -minZ + cameraZ : cameraZ - minZ;

            camera.far = cameraToFarEdge * 3;
            camera.updateProjectionMatrix();

            controls.target.copy(center);
            controls.maxDistance = cameraToFarEdge * 2;
            controls.update();

            hideErrorMessage();
        },
        undefined,
        function (error) {
            console.error('An error occurred while loading the model:', error);
            showErrorMessage('模型加载失败，请重试或选择其他模型。');
        }
    );
}

function showErrorMessage(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function hideErrorMessage() {
    const errorElement = document.getElementById('error-message');
    errorElement.style.display = 'none';
}

document.getElementById('model-select').addEventListener('change', function (event) {
    const selectedModel = event.target.value;
    if (selectedModel) {
        loadModel(selectedModel);
    }
});

init();