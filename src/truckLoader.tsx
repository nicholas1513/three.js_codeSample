import { Grid, Slider, Typography } from "@material-ui/core";
import React, { Component } from "react";
import * as THREE from "three";
import { AmbientLight, Group, PointLight, Scene } from "three";
import OrbitControls from "three-orbitcontrols";

import { load1 } from './loads/load1';

interface IState {
    load: any;
    loadSequence: number;
}

interface IProps {
    width: number,
    height: number
}

export default class TruckLoader extends React.Component<IProps, IState> {
    mount: any;
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    camera: THREE.Camera;
    cube: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>;
    frameId: any;
    margin: number;
    scale: number;
    controls: any;
    group: any;
    lightAmbient: any;
    lightPoint: any;

    constructor(props:IProps){
        super(props);
        
        this.state = {
            load: load1,
            loadSequence: 0
        }

        this.scene = new THREE.Scene();

        //Add Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setClearColor(0);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.props.width, this.props.height);
        this.renderer.shadowMap.enabled = true;
	    this.renderer.shadowMap.type = THREE.BasicShadowMap;

        // Camera settings
        this.camera = new THREE.PerspectiveCamera(80, this.props.width / this.props.height, 0.1, 20000);
        this.camera.position.z = 2500;
        this.camera.position.y = 2500;

        // Create camera controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.maxPolarAngle = Math.PI / 2;
        this.group = new Group();
        this.scene.add(this.group);

        // Scene settings
        this.scene = new Scene();
        this.lightAmbient = new AmbientLight(0xFFFFFF, 0.5);
        this.scene.add(this.lightAmbient);
        this.lightPoint = new PointLight(0xFFFFFF, 0.5);
        this.scene.add(this.lightPoint);
        this.lightPoint.position.y = 7000;
        this.lightPoint.position.z = 7000;
        this.lightPoint.position.x = 7000;
        
        this.margin = 50;
        this.scale = 2000.0 / Math.max(this.state.load.zLength, this.state.load.zWidth, this.state.load.zHeight);
    }

    public componentDidMount() {
        this.mount.appendChild(this.renderer.domElement);
        
        // Need to sort items by index value to assure they are rendered in order
        var load = this.state.load;
        load.items = load.items.sort((a: any, b: any) => { return a.index - b.index; })
        this.setState({
            load: load
        });

        this.loadSequenceSlider(this.state.load, this.scale);
        this.start();
    }

    private initLoadZone = (load:any, scale:number) => {
        let loadGroup = new THREE.Group();
        let innerLoadZone = new THREE.BoxBufferGeometry(load.zWidth * scale, load.zHeight * scale, load.zLength * scale);
        let material = new THREE.MeshLambertMaterial({ side: THREE.BackSide, color: 'white', wireframe: false });
        let innerloadZoneMesh = new THREE.Mesh(innerLoadZone, material);

        innerloadZoneMesh.position.x = load.zWidth / 2 * scale - 1000;
        innerloadZoneMesh.position.y = load.zHeight / 2 * scale - 1000;
        innerloadZoneMesh.position.z = load.zLength / 2 * scale - 1000;
        loadGroup.add(innerloadZoneMesh);

        
        let outerLoadZone = new THREE.BoxBufferGeometry(
            (load.zWidth  + this.margin) * scale, 
            (load.zHeight + this.margin) * scale, 
            (load.zLength + this.margin) * scale);
        let outerMaterial = new THREE.MeshLambertMaterial({ side: THREE.BackSide, color: 'gray', wireframe: false });
        let outerLoadZoneMesh = new THREE.Mesh(outerLoadZone, outerMaterial);

        outerLoadZoneMesh.position.x = (load.zWidth ) / 2 * scale - 1000;
        outerLoadZoneMesh.position.y = (load.zHeight ) / 2 * scale - 1000;
        outerLoadZoneMesh.position.z = (load.zLength ) / 2 * scale - 1000;

        loadGroup.add(outerLoadZoneMesh);

        return loadGroup;
    }

    private loadSequenceSlider(group: any, scene: any) {
        // Remove the old group that may currently be rendered.
        for (let i = 0; i < this.scene.children.length; i++) {
            if (this.scene.children[i].name == 'TruckLoad') {
                this.scene.remove(this.scene.children[i]);
            }
        }

        // Create a  new group to organize the items we want to be rendered. 
        group = new THREE.Group();
        group.name = 'TruckLoad';

        // Only add items up to the index value matching the current load sequence.
        for (let i = 0; i < this.state.loadSequence; i++) {
            let item = this.makeItem(this.state.load.items[i], 10, this.scale);
            group.add(item);
        }

        // This is where we add the loading zone, where items will be loaded! 
        let truckLoad = this.initLoadZone(this.state.load, this.scale);
        group.add(truckLoad);

        // Lastly, add the group to the scene. 
        this.scene.add(group);
    };

    private makeItem(item: any, margin:number, scale: number) {
        const width  = (item.width  * scale) - margin;
        const height = (item.height * scale) - margin;
        const length = (item.length * scale) - margin;
        
        let geometry = new THREE.BoxGeometry(width, height, length);        
        let mesh = this.creatTexturedMesh(geometry, item);

        let edges = new THREE.LineSegments(
            new THREE.EdgesGeometry(geometry), 
            new THREE.LineBasicMaterial({ color: 'black' })
            );
        mesh.add(edges);
        
        const zoneWidth = this.state.load.zWidth ?? 0;
        const zoneHeight = this.state.load.zHeight ?? 0;
        const zoneLength = this.state.load.zLength ?? 0;

        // Translate the mesh to be positioned correctly based on the size of the item and loading zone.
        mesh.position.y = ((item.y + item.height / 2) * scale) - zoneHeight + margin;
        mesh.position.z = ((item.z + item.length / 2) * scale) - zoneLength + margin;
        mesh.position.x = ((item.x + item.width / 2) * scale)  - zoneWidth + margin;

        return mesh;
    }

    // Still looking into applying textures to mesh.  Showing up all black, rather than showing texture
    // when attempting to use THREE.MeshPhongMaterial.  possible lighting issue?
    public creatTexturedMesh = (geometry:any, item:any) => {
        var textureLoader = new THREE.TextureLoader();

        const textureMap = textureLoader.load("./assets/textures/crate/crate_diffuse.png");
        const bumpMap = textureLoader.load("./assets/textures/crate/crate_bump.png");
        const normalMap = textureLoader.load("./assets/textures/crate/crate_normal.png");

        let material = new THREE.MeshLambertMaterial({
            color: item.color
        });

        let mesh = new THREE.Mesh( geometry, material);
        
        return mesh
    }
    
    public componentWillUnmount() {
        this.stop();
        this.mount.removeChild(this.renderer.domElement);
    }

    private start = () => {
        if (!this.frameId) {
            this.frameId = requestAnimationFrame(this.animate);
        }
    };

    private stop = () => {
        cancelAnimationFrame(this.frameId);
    };

    private animate = () => {
        this.renderScene();
        this.frameId = window.requestAnimationFrame(this.animate);
    };

    public renderScene = () => {
        if (this.renderer) this.renderer.render(this.scene, this.camera);
    };

    public getLoadSequenceTextValue = () => {
        return `${this.state.loadSequence}`
    }
        
    render() {

        const handleChange = (event: any, newValue:number) => {
            if(this.state.loadSequence !== newValue){
                this.setState({
                    loadSequence: newValue
                })
                this.loadSequenceSlider(this.group, this.scene);
            }   
        }

        return (
            <Grid className={"truckLoader"} container>
                <Grid 
                    className={"truckLoader-canvas"}
                    ref={mount => { this.mount = mount; }}
                >
                    <Grid className={"sample-control-group"}>
                        <Grid className={"sample-control"}>
                            <Typography id={"sample-control-label"} gutterBottom>
                                Load Sequence
                            </Typography>
                            <Slider className="sample-sequence-slider"
                                aria-labelledby={'sample-control-label'}
                                defaultValue={this.state.loadSequence} 
                                getAriaValueText={this.getLoadSequenceTextValue}
                                valueLabelDisplay="auto"
                                marks
                                onChange={handleChange}
                                min={0} max={this.state.load.items.length}
                                step={1}/>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        );
    }
}