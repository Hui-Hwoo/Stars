import * as THREE from "three";
// import * as dat from "dat.gui";
import gsap from "gsap";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// =============================== //
//         Basic Elements          //
// =============================== //
const sence = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.z = 60;
const renderer = new THREE.WebGLRenderer();
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);
document.body.appendChild(renderer.domElement);

const raycaster = new THREE.Raycaster();

// =============================== //
//         Custom Elements         //
// =============================== //

// [Plane]
const world = {
    plane: {
        width: 400,
        height: 400,
        widthSegments: 50,
        heightSegments: 50,
    },
};
const planeGeometry = new THREE.PlaneGeometry(
    world.plane.width,
    world.plane.height,
    world.plane.widthSegments,
    world.plane.heightSegments
);
const planeMaterial = new THREE.MeshPhongMaterial({
    side: THREE.DoubleSide,
    flatShading: true,
    vertexColors: true,
});
const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
sence.add(planeMesh);

// [Star]
const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff });

const starVertices = [];
for (let i = 0; i < 1000; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    starVertices.push(x, y, z);
}
starGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(starVertices, 3)
);

const stars = new THREE.Points(starGeometry, starMaterial);
sence.add(stars);

// [Light]
const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(0, 0, 2);
sence.add(light);

const backLight = new THREE.DirectionalLight(0xffffff, 2);
backLight.position.set(0, 0, -2);
sence.add(backLight);

// =============================== //
//         Custom Varibales        //
// =============================== //
interface ExtendedBufferAttribute extends THREE.BufferAttribute {
    originalPosition: THREE.TypedArray;
    randomValues: number[];
}

// =============================== //
//         Custom Functions        //
// =============================== //

// [Generate Plane]

const generatePlane = () => {
    planeMesh.geometry.dispose();
    planeMesh.geometry = new THREE.PlaneGeometry(
        world.plane.width,
        world.plane.height,
        world.plane.widthSegments,
        world.plane.heightSegments
    );

    const position = planeMesh.geometry.attributes
        .position as ExtendedBufferAttribute;
    position.originalPosition = position.array.slice();

    const randomValues = [];
    for (let i = 0; i < position.array.length; i += 3) {
        randomValues.push(Math.random() * Math.PI * 2);
        randomValues.push(Math.random() * Math.PI * 2);
        randomValues.push(Math.random() * Math.PI * 2);
    }

    position.randomValues = randomValues;
    console.log("Update Random Values");

    const { array } = planeMesh.geometry.attributes
        .position as ExtendedBufferAttribute;

    for (let i = 0; i < array.length; i += 3) {
        const x = array[i];
        const y = array[i + 1];
        const z = array[i + 2];
        array[i] = x + (Math.random() - 0.5) * 3;
        array[i + 1] = y + (Math.random() - 0.5) * 3;
        array[i + 2] = z + (Math.random() - 0.5) * 12;
    }

    const colors: number[] = [];
    for (let i = 0; i < planeMesh.geometry.attributes.position.count; i++) {
        colors.push(0, 0.19, 0.4);
    }

    planeMesh.geometry.setAttribute(
        "color",
        new THREE.BufferAttribute(new Float32Array(colors), 3)
    );
};

// [Animate]
let frame = 0;
function animate() {
    requestAnimationFrame(animate);

    // planeMesh.rotation.x += 0.02;
    renderer.render(sence, camera);
    raycaster.setFromCamera(mouse, camera);
    frame += 0.1;

    const { array, originalPosition, randomValues } = planeMesh.geometry
        .attributes.position as ExtendedBufferAttribute;

    for (let i = 0; i < array.length; i += 3) {
        array[i] =
            originalPosition[i] + Math.cos(frame + randomValues[i]) * 0.5;
        array[i + 1] =
            originalPosition[i + 1] +
            Math.sin(frame + randomValues[i + 1]) * 0.5;
    }

    planeMesh.geometry.attributes.position.needsUpdate = true;

    const intersects = raycaster.intersectObject(planeMesh);

    if (intersects.length > 0) {
        // @ts-ignore
        const { color } = intersects[0].object.geometry.attributes;

        if (intersects[0]?.face && color) {
            // vertice 1
            color.setX(intersects[0].face.a, 0.1);
            color.setY(intersects[0].face.a, 0.5);
            color.setZ(intersects[0].face.a, 1);

            // vertice 2
            color.setX(intersects[0].face.b, 0.1);
            color.setY(intersects[0].face.b, 0.5);
            color.setZ(intersects[0].face.b, 1);

            // vertice 3
            color.setX(intersects[0].face.c, 0.1);
            color.setY(intersects[0].face.c, 0.5);
            color.setZ(intersects[0].face.c, 1);
            color.needsUpdate = true;

            const initialColor = {
                r: 0,
                g: 0.19,
                b: 0.4,
            };
            const hoverColor = {
                r: 0.1,
                g: 0.5,
                b: 1,
            };

            gsap.to(hoverColor, {
                r: initialColor.r,
                g: initialColor.g,
                b: initialColor.b,
                duration: 1,
                onUpdate: () => {
                    const face = intersects[0].face as THREE.Face;

                    color.setX(face.a, hoverColor.r);
                    color.setY(face.a, hoverColor.g);
                    color.setZ(face.a, hoverColor.b);

                    color.setX(face.b, hoverColor.r);
                    color.setY(face.b, hoverColor.g);
                    color.setZ(face.b, hoverColor.b);

                    color.setX(face.c, hoverColor.r);
                    color.setY(face.c, hoverColor.g);
                    color.setZ(face.c, hoverColor.b);
                    color.needsUpdate = true;
                },
            });
        }
    }

    stars.rotation.x += 0.0005;
}

const mouse = new THREE.Vector2(0, 0);

addEventListener("mousemove", (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

// =============================== //
//             GUI                 //
// =============================== //

// const gui = new dat.GUI();
// gui.add(world.plane, "width", 1, 20).onChange(() => {
//     generatePlane();
// });
// gui.add(world.plane, "height", 1, 20).onChange(() => {
//     generatePlane();
// });
// gui.add(world.plane, "widthSegments", 1, 20).onChange(() => {
//     generatePlane();
// });
// gui.add(world.plane, "heightSegments", 1, 20).onChange(() => {
//     generatePlane();
// });

// =============================== //
//           Main Loop             //
// =============================== //

generatePlane();
animate();

new OrbitControls(camera, renderer.domElement);

gsap.to("#christopherLis", {
    opacity: 1,
    duration: 1.5,
    y: 0,
    ease: "expo",
});

gsap.to("#oneWithAn", {
    opacity: 1,
    duration: 1.5,
    delay: 0.3,
    y: 0,
    ease: "expo",
});

gsap.to("#viewWorkBtn", {
    opacity: 1,
    duration: 1.5,
    delay: 0.6,
    y: 0,
    ease: "expo",
});

document.querySelector("#viewWorkBtn")!.addEventListener("click", (e) => {
    e.preventDefault();

    gsap.to("#container", {
        opacity: 0,
    });

    gsap.to(camera.position, {
        z: 35,
        duration: 2,
        ease: "power3.inOut",
    });

    gsap.to(planeMesh.rotation, {
        x: -1.4,
        duration: 2,
        ease: "power3.inOut",
    });

    gsap.to(planeMesh.position, {
        y: -1000,
        delay: 2,
        duration: 2,
        ease: "power3.in",
    });
});

addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});
