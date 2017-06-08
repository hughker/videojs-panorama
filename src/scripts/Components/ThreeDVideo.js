// @flow

import type { Player, Settings } from '../types';
import BaseCanvas from './BaseCanvas';
import THREE from "three";

class ThreeDVideo extends BaseCanvas{
    _VRMode: boolean;
    _scene: any;

    _cameraL: any;
    _cameraR: any;

    _meshL: any;
    _meshR: any;

    constructor(player: Player, options: Settings){
        super(player, options);

        //only show left part by default
        this._VRMode = false;
        //define scene
        this._scene = new THREE.Scene();

        let aspectRatio = this._width / this._height;
        //define camera
        this._cameraL = new THREE.PerspectiveCamera(this.options.initFov, aspectRatio, 1, 2000);
        this._cameraL.target = new THREE.Vector3( 0, 0, 0 );

        this._cameraR = new THREE.PerspectiveCamera(this.options.initFov, aspectRatio / 2, 1, 2000);
        this._cameraR.position.set( 1000, 0, 0 );
        this._cameraR.target = new THREE.Vector3( 1000, 0, 0 );

        let geometryL = new THREE.SphereBufferGeometry(500, 60, 40).toNonIndexed();
        let geometryR = new THREE.SphereBufferGeometry(500, 60, 40).toNonIndexed();

        let uvsL = geometryL.attributes.uv.array;
        let normalsL = geometryL.attributes.normal.array;
        for ( let i = 0; i < normalsL.length / 3; i ++ ) {
            uvsL[ i * 2 + 1 ] = uvsL[ i * 2 + 1 ] / 2;
        }

        let uvsR = geometryR.attributes.uv.array;
        let normalsR = geometryR.attributes.normal.array;
        for ( let i = 0; i < normalsR.length / 3; i ++ ) {
            uvsR[ i * 2 + 1 ] = uvsR[ i * 2 + 1 ] / 2 + 0.5;
        }

        geometryL.scale( - 1, 1, 1 );
        geometryR.scale( - 1, 1, 1 );

        this._meshL = new THREE.Mesh(geometryL,
            new THREE.MeshBasicMaterial({ map: this._texture})
        );

        this._meshR = new THREE.Mesh(geometryR,
            new THREE.MeshBasicMaterial({ map: this._texture})
        );
        this._meshR.position.set(1000, 0, 0);

        this._scene.add(this._meshL);
    }

    handleResize(): void{
        super.handleResize();

        let aspectRatio = this._width / this._height;
        if(!this._VRMode) {
            this._cameraL.aspect = aspectRatio;
            this._cameraL.updateProjectionMatrix();
        }else{
            aspectRatio /= 2;
            this._cameraL.aspect = aspectRatio;
            this._cameraR.aspect = aspectRatio;
            this._cameraL.updateProjectionMatrix();
            this._cameraR.updateProjectionMatrix();
        }
    }

    handleMouseWheel(event: any){
        super.handleMouseWheel(event);

        // WebKit
        if ( event.wheelDeltaY ) {
            this._cameraL.fov -= event.wheelDeltaY * 0.05;
            // Opera / Explorer 9
        } else if ( event.wheelDelta ) {
            this._cameraL.fov -= event.wheelDelta * 0.05;
            // Firefox
        } else if ( event.detail ) {
            this._cameraL.fov += event.detail * 1.0;
        }
        this._cameraL.fov = Math.min(this.options.maxFov, this._cameraL.fov);
        this._cameraL.fov = Math.max(this.options.minFov, this._cameraL.fov);
        this._cameraL.updateProjectionMatrix();
        if(this._VRMode){
            this._cameraR.fov = this._cameraL.fov;
            this._cameraR.updateProjectionMatrix();
        }
    }

    enableVR() {
        this._VRMode = true;
        this._scene.add(this._meshR);
        this.handleResize();
    }

    disableVR() {
        this._VRMode = false;
        this._scene.remove(this._meshR);
        this.handleResize();
    }

    render(){
        super.render();

        this._cameraL.target.x = 500 * Math.sin( this._phi ) * Math.cos( this._theta );
        this._cameraL.target.y = 500 * Math.cos( this._phi );
        this._cameraL.target.z = 500 * Math.sin( this._phi ) * Math.sin( this._theta );
        this._cameraL.lookAt(this._cameraL.target);

        if(this._VRMode){
            let viewPortWidth = this._width / 2, viewPortHeight = this._height;
            this._cameraR.target.x = 1000 + 500 * Math.sin( this._phi ) * Math.cos( this._theta );
            this._cameraR.target.y = 500 * Math.cos( this._phi );
            this._cameraR.target.z = 500 * Math.sin( this._phi ) * Math.sin( this._theta );
            this._cameraR.lookAt( this._cameraR.target );

            // render left eye
            this._renderer.setViewport( 0, 0, viewPortWidth, viewPortHeight );
            this._renderer.setScissor( 0, 0, viewPortWidth, viewPortHeight );
            this._renderer.render( this._scene, this._cameraL );

            // render right eye
            this._renderer.setViewport( viewPortWidth, 0, viewPortWidth, viewPortHeight );
            this._renderer.setScissor( viewPortWidth, 0, viewPortWidth, viewPortHeight );
            this._renderer.render( this._scene, this._cameraR );
        }else{
            this._renderer.render( this._scene, this._cameraL );
        }
    }
}

export default ThreeDVideo;