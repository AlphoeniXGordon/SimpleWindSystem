/**
 * 风场系统应用 - 主程序入口
 * 初始化场景、相机、渲染器和控制，并管理动画循环
 */

class WindSystemApp {
  constructor() {
    // 应用状态
    this.isRunning = false;
    
    // 性能监控
    this.stats = null;
    
    // 场景元素
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    
    // 系统组件
    this.clock = null;
    this.particleSystem = null;
    this.globalWindField = null;
    this.uiControls = null;
    
    // 初始化应用
    this.init();
  }
  
  // 初始化场景和系统
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    
    // 创建相机
    this.camera = new THREE.PerspectiveCamera(
      60, // 视野角度
      window.innerWidth / window.innerHeight, // 宽高比
      0.1, // 近裁剪面
      1000 // 远裁剪面
    );
    this.camera.position.set(0, 0, 100);
    this.camera.lookAt(0, 0, 0);
    
    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({
      canvas: document.getElementById('scene'),
      antialias: true
    });
    this.renderer.setSize(window.innerWidth - 300, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    
    // 创建轨道控制器
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    
    // 添加环境光照
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    // 创建时钟对象
    this.clock = new THREE.Clock();
    
    // 创建参考坐标系
    this.addReferenceGrid();
    
    // 创建粒子系统
    this.particleSystem = new ParticleSystem(this.scene);
    
    // 创建UI控制
    this.uiControls = new WindSystemControls(this);
    
    // 添加窗口大小调整事件监听
    window.addEventListener('resize', () => this.onWindowResize());
    
    // 开始动画循环
    this.start();
  }
  
  // 添加参考网格和坐标轴
  addReferenceGrid() {
    // 添加网格
    const gridHelper = new THREE.GridHelper(100, 10, 0x555555, 0x333333);
    this.scene.add(gridHelper);
    
    // 添加坐标轴
    const axesHelper = new THREE.AxesHelper(50);
    this.scene.add(axesHelper);
    
    // 添加包围盒
    const boxGeometry = new THREE.BoxGeometry(100, 100, 100);
    const boxMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.05
    });
    
    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    this.scene.add(box);
  }
  
  // 窗口大小调整处理
  onWindowResize() {
    this.camera.aspect = (window.innerWidth - 300) / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth - 300, window.innerHeight);
  }
  
  // 开始动画循环
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.clock.start();
    this.animate();
  }
  
  // 停止动画循环
  stop() {
    this.isRunning = false;
    this.clock.stop();
  }
  
  // 动画循环
  animate() {
    if (!this.isRunning) return;
    
    // 请求下一帧
    requestAnimationFrame(() => this.animate());
    
    // 获取时间增量
    const delta = this.clock.getDelta();
    
    // 更新粒子系统
    this.particleSystem.update(delta);
    
    // 更新轨道控制器
    this.controls.update();
    
    // 渲染场景
    this.renderer.render(this.scene, this.camera);
  }
  
  // 清理资源
  dispose() {
    this.stop();
    
    // 清理粒子系统
    if (this.particleSystem) {
      this.particleSystem.dispose();
    }
    
    // 移除事件监听器
    window.removeEventListener('resize', this.onWindowResize);
    
    // 清理Three.js资源
    this.renderer.dispose();
    
    // 清理DOM引用
    this.renderer.domElement = null;
    this.controls.dispose();
  }
}

// 在页面加载完成后创建应用实例
window.addEventListener('DOMContentLoaded', () => {
  window.app = new WindSystemApp();
}); 