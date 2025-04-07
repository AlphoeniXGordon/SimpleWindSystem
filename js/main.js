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
    this.transformControls = null; // 用于直接在场景中移动风场
    
    // 系统组件
    this.clock = null;
    this.particleSystem = null;
    this.globalWindField = null;
    this.uiControls = null;
    
    // 选中的风场对象
    this.selectedWindField = null;
    this.selectedWindFieldVisualizer = null;
    
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
    
    // 创建变换控制器，用于移动风场
    this.transformControls = new THREE.TransformControls(this.camera, this.renderer.domElement);
    this.transformControls.setSize(0.8); // 稍微缩小控制手柄以免遮挡
    this.transformControls.addEventListener('dragging-changed', (event) => {
      // 当拖动开始或结束时，禁用或启用轨道控制器
      this.controls.enabled = !event.value;
      
      // 如果处于拖动结束的状态，并且有选中的风场，更新UI界面上的位置数值
      if (!event.value && this.selectedWindField) {
        this.uiControls.updateWindFieldPositionUI(this.selectedWindField);
      }
    });
    
    // 在变换过程中，实时更新风场位置
    this.transformControls.addEventListener('objectChange', () => {
      if (this.selectedWindField && this.selectedWindFieldVisualizer) {
        // 从变换控件获取位置并更新风场
        this.selectedWindField.position.copy(this.selectedWindFieldVisualizer.position);
      }
    });
    
    this.scene.add(this.transformControls);
    
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
  
  // 选择风场并显示变换控制器
  selectWindField(windField, visualizer) {
    // 如果已经选择了这个风场，不需要做任何事情
    if (this.selectedWindField === windField) return;
    
    this.selectedWindField = windField;
    this.selectedWindFieldVisualizer = visualizer;
    
    // 将变换控制器附加到可视化对象上
    if (visualizer) {
      this.transformControls.attach(visualizer);
    } else {
      this.transformControls.detach();
    }
    
    // 设置变换模式为位移
    this.transformControls.setMode('translate');
    
    // 通知UI更新选中状态
    if (this.uiControls) {
      this.uiControls.updateSelectedWindField(windField);
    }
  }
  
  // 取消选择风场
  deselectWindField() {
    this.selectedWindField = null;
    this.selectedWindFieldVisualizer = null;
    this.transformControls.detach();
    
    // 通知UI更新选中状态
    if (this.uiControls) {
      this.uiControls.updateSelectedWindField(null);
    }
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
    this.transformControls.dispose();
  }
}

// 在页面加载完成后创建应用实例
window.addEventListener('DOMContentLoaded', () => {
  window.app = new WindSystemApp();
}); 