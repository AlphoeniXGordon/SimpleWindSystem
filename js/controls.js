/**
 * 控制界面 - 处理风场系统的用户界面交互
 */

class WindSystemControls {
  constructor(app) {
    this.app = app;
    this.windFieldVisualizers = new Map(); // 存储风场ID到可视化对象的映射
    
    this.setupEventListeners();
  }
  
  // 设置所有事件监听器
  setupEventListeners() {
    // 全局风场控制
    this.setupGlobalWindControls();
    
    // 点风场控制
    document.getElementById('add-point-wind').addEventListener('click', () => this.addPointWindField());
    
    // 锥体风场控制
    document.getElementById('add-cone-wind').addEventListener('click', () => this.addConeWindField());
    
    // 螺旋风场控制
    document.getElementById('add-spiral-wind').addEventListener('click', () => this.addSpiralWindField());
    
    // 粒子系统控制
    this.setupParticleControls();
  }
  
  // 设置全局风场控制
  setupGlobalWindControls() {
    const xInput = document.getElementById('global-wind-direction-x');
    const yInput = document.getElementById('global-wind-direction-y');
    const zInput = document.getElementById('global-wind-direction-z');
    const strengthInput = document.getElementById('global-wind-strength');
    
    // 创建默认的全局风场
    const direction = new THREE.Vector3(
      parseFloat(xInput.value),
      parseFloat(yInput.value),
      parseFloat(zInput.value)
    );
    
    const strength = parseFloat(strengthInput.value);
    
    this.app.globalWindField = new GlobalWindField(direction, strength);
    this.app.particleSystem.addWindField(this.app.globalWindField);
    
    // 添加全局风场可视化
    const visualizer = this.app.globalWindField.createVisualizer();
    this.app.scene.add(visualizer);
    this.windFieldVisualizers.set(this.app.globalWindField.id, visualizer);
    
    // 监听输入变化
    xInput.addEventListener('input', () => this.updateGlobalWind());
    yInput.addEventListener('input', () => this.updateGlobalWind());
    zInput.addEventListener('input', () => this.updateGlobalWind());
    strengthInput.addEventListener('input', () => this.updateGlobalWind());
    
    // 更新值显示
    xInput.addEventListener('input', () => {
      document.getElementById('global-wind-direction-x-value').textContent = xInput.value;
    });
    
    yInput.addEventListener('input', () => {
      document.getElementById('global-wind-direction-y-value').textContent = yInput.value;
    });
    
    zInput.addEventListener('input', () => {
      document.getElementById('global-wind-direction-z-value').textContent = zInput.value;
    });
    
    strengthInput.addEventListener('input', () => {
      document.getElementById('global-wind-strength-value').textContent = strengthInput.value;
    });
    
    // 修改全局风场强度的最大值
    strengthInput.max = "500";
    
    // 添加噪声和正弦波参数控制
    this.addGlobalWindDynamicsControls();
  }
  
  // 添加全局风场动态变化控制
  addGlobalWindDynamicsControls() {
    const container = document.getElementById('global-wind-controls');
    
    // 创建噪声强度控制
    const noiseControl = this.createRangeControl('噪声强度:', 0, 0.5, this.app.globalWindField.noiseScale, (value) => {
      this.app.globalWindField.noiseScale = parseFloat(value);
    });
    
    // 创建噪声空间尺度控制
    const noiseSpaceControl = this.createRangeControl('空间尺度:', 0.01, 0.2, this.app.globalWindField.noiseSpaceScale, (value) => {
      this.app.globalWindField.noiseSpaceScale = parseFloat(value);
    });
    
    // 创建正弦波振幅控制
    const amplitudeControl = this.createRangeControl('波动振幅:', 0, 0.5, this.app.globalWindField.sinAmplitude, (value) => {
      this.app.globalWindField.sinAmplitude = parseFloat(value);
    });
    
    // 创建正弦波频率控制
    const frequencyControl = this.createRangeControl('波动频率:', 0.1, 2, this.app.globalWindField.sinFrequency, (value) => {
      this.app.globalWindField.sinFrequency = parseFloat(value);
    });
    
    // 添加控制器到容器
    container.appendChild(document.createElement('hr'));
    container.appendChild(document.createElement('h3')).textContent = '动态效果';
    container.appendChild(noiseControl);
    container.appendChild(noiseSpaceControl);
    container.appendChild(amplitudeControl);
    container.appendChild(frequencyControl);
  }
  
  // 更新全局风场
  updateGlobalWind() {
    const xInput = document.getElementById('global-wind-direction-x');
    const yInput = document.getElementById('global-wind-direction-y');
    const zInput = document.getElementById('global-wind-direction-z');
    const strengthInput = document.getElementById('global-wind-strength');
    
    const direction = new THREE.Vector3(
      parseFloat(xInput.value),
      parseFloat(yInput.value),
      parseFloat(zInput.value)
    );
    
    const strength = parseFloat(strengthInput.value);
    
    // 更新基础方向和当前方向
    this.app.globalWindField.baseDirection.copy(direction.normalize());
    this.app.globalWindField.direction.copy(this.app.globalWindField.baseDirection);
    this.app.globalWindField.strength = strength;
    
    // 更新可视化
    const visualizer = this.windFieldVisualizers.get(this.app.globalWindField.id);
    this.app.globalWindField.updateVisualizer(visualizer);
  }
  
  // 添加点风场
  addPointWindField() {
    // 在场景中心附近随机生成一个点风场
    const position = new THREE.Vector3(
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 30
    );
    
    const strength = 1.5; // 增加默认强度
    const isOutward = Math.random() > 0.5; // 随机决定是向外的还是向内的
    
    const pointWind = new PointWindField(position, strength, isOutward);
    // 增加影响范围
    pointWind.maxDistance = 12;
    this.app.particleSystem.addWindField(pointWind);
    
    // 创建并添加可视化
    const visualizer = pointWind.createVisualizer();
    this.app.scene.add(visualizer);
    this.windFieldVisualizers.set(pointWind.id, visualizer);
    
    // 添加控制UI
    this.createPointWindControls(pointWind);
    
    // 打印确认消息，帮助调试
    console.log(`已添加点风场，ID: ${pointWind.id}, 方向: ${isOutward ? '向外' : '向内'}`);
  }
  
  // 创建点风场的控制UI
  createPointWindControls(pointWind) {
    const container = document.getElementById('point-wind-fields');
    
    const fieldElement = document.createElement('div');
    fieldElement.className = 'field-control';
    fieldElement.dataset.id = pointWind.id;
    
    // 添加标题和删除按钮
    const header = document.createElement('div');
    header.className = 'field-header';
    
    const title = document.createElement('span');
    title.textContent = pointWind.isOutward ? '向外点风场' : '向内点风场';
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = '删除';
    removeBtn.addEventListener('click', () => {
      this.removeWindField(pointWind.id, 'point-wind-fields');
    });
    
    header.appendChild(title);
    header.appendChild(removeBtn);
    
    fieldElement.appendChild(header);
    
    // 创建位置控制
    const posXControl = this.createRangeControl('X位置:', -50, 50, pointWind.position.x, (value) => {
      pointWind.position.x = parseFloat(value);
      const visualizer = this.windFieldVisualizers.get(pointWind.id);
      pointWind.updateVisualizer(visualizer);
    });
    
    const posYControl = this.createRangeControl('Y位置:', -50, 50, pointWind.position.y, (value) => {
      pointWind.position.y = parseFloat(value);
      const visualizer = this.windFieldVisualizers.get(pointWind.id);
      pointWind.updateVisualizer(visualizer);
    });
    
    const posZControl = this.createRangeControl('Z位置:', -50, 50, pointWind.position.z, (value) => {
      pointWind.position.z = parseFloat(value);
      const visualizer = this.windFieldVisualizers.get(pointWind.id);
      pointWind.updateVisualizer(visualizer);
    });
    
    // 创建强度控制
    const strengthControl = this.createRangeControl('强度:', 0, 500, pointWind.strength, (value) => {
      pointWind.strength = parseFloat(value);
    });
    
    // 创建范围控制
    const rangeControl = this.createRangeControl('范围:', 1, 20, pointWind.maxDistance, (value) => {
      pointWind.maxDistance = parseFloat(value);
      const visualizer = this.windFieldVisualizers.get(pointWind.id);
      pointWind.updateVisualizer(visualizer);
    });
    
    // 创建方向控制
    const directionControl = document.createElement('div');
    directionControl.className = 'control';
    
    const directionLabel = document.createElement('label');
    directionLabel.textContent = '方向:';
    
    const directionSelect = document.createElement('select');
    
    const outwardOption = document.createElement('option');
    outwardOption.value = 'outward';
    outwardOption.textContent = '向外';
    outwardOption.selected = pointWind.isOutward;
    
    const inwardOption = document.createElement('option');
    inwardOption.value = 'inward';
    inwardOption.textContent = '向内';
    inwardOption.selected = !pointWind.isOutward;
    
    directionSelect.appendChild(outwardOption);
    directionSelect.appendChild(inwardOption);
    
    directionSelect.addEventListener('change', () => {
      pointWind.isOutward = directionSelect.value === 'outward';
      title.textContent = pointWind.isOutward ? '向外点风场' : '向内点风场';
      const visualizer = this.windFieldVisualizers.get(pointWind.id);
      pointWind.updateVisualizer(visualizer);
    });
    
    directionControl.appendChild(directionLabel);
    directionControl.appendChild(directionSelect);
    
    // 添加控制元素到容器
    fieldElement.appendChild(posXControl);
    fieldElement.appendChild(posYControl);
    fieldElement.appendChild(posZControl);
    fieldElement.appendChild(strengthControl);
    fieldElement.appendChild(rangeControl);
    fieldElement.appendChild(directionControl);
    
    container.appendChild(fieldElement);
  }
  
  // 添加锥体风场
  addConeWindField() {
    // 在场景中心附近随机生成一个锥体风场
    const position = new THREE.Vector3(
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 30
    );
    
    // 随机方向
    const direction = new THREE.Vector3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    ).normalize();
    
    const strength = 20.0; // 大幅增加默认强度从2.5到20.0
    const angle = Math.PI / 5; // 调整为36度，更合适的锥角
    
    const coneWind = new ConeWindField(position, direction, strength, angle);
    coneWind.maxDistance = 25; // 增加最大影响距离从20到25
    this.app.particleSystem.addWindField(coneWind);
    
    // 创建并添加可视化
    const visualizer = coneWind.createVisualizer();
    this.app.scene.add(visualizer);
    this.windFieldVisualizers.set(coneWind.id, visualizer);
    
    // 添加控制UI
    this.createConeWindControls(coneWind);
    
    // 打印确认消息，帮助调试
    console.log(`已添加锥体风场，ID: ${coneWind.id}, 方向: ${direction.x.toFixed(2)}, ${direction.y.toFixed(2)}, ${direction.z.toFixed(2)}`);
  }
  
  // 创建锥体风场的控制UI
  createConeWindControls(coneWind) {
    const container = document.getElementById('cone-wind-fields');
    
    const fieldElement = document.createElement('div');
    fieldElement.className = 'field-control';
    fieldElement.dataset.id = coneWind.id;
    
    // 添加标题和删除按钮
    const header = document.createElement('div');
    header.className = 'field-header';
    
    const title = document.createElement('span');
    title.textContent = '锥体风场';
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = '删除';
    removeBtn.addEventListener('click', () => {
      this.removeWindField(coneWind.id, 'cone-wind-fields');
    });
    
    header.appendChild(title);
    header.appendChild(removeBtn);
    
    fieldElement.appendChild(header);
    
    // 创建位置控制
    const posXControl = this.createRangeControl('X位置:', -50, 50, coneWind.position.x, (value) => {
      coneWind.position.x = parseFloat(value);
      const visualizer = this.windFieldVisualizers.get(coneWind.id);
      coneWind.updateVisualizer(visualizer);
    });
    
    const posYControl = this.createRangeControl('Y位置:', -50, 50, coneWind.position.y, (value) => {
      coneWind.position.y = parseFloat(value);
      const visualizer = this.windFieldVisualizers.get(coneWind.id);
      coneWind.updateVisualizer(visualizer);
    });
    
    const posZControl = this.createRangeControl('Z位置:', -50, 50, coneWind.position.z, (value) => {
      coneWind.position.z = parseFloat(value);
      const visualizer = this.windFieldVisualizers.get(coneWind.id);
      coneWind.updateVisualizer(visualizer);
    });
    
    // 创建方向控制
    const dirXControl = this.createRangeControl('X方向:', -1, 1, coneWind.direction.x, (value) => {
      coneWind.direction.x = parseFloat(value);
      coneWind.direction.normalize();
      const visualizer = this.windFieldVisualizers.get(coneWind.id);
      coneWind.updateVisualizer(visualizer);
    });
    
    const dirYControl = this.createRangeControl('Y方向:', -1, 1, coneWind.direction.y, (value) => {
      coneWind.direction.y = parseFloat(value);
      coneWind.direction.normalize();
      const visualizer = this.windFieldVisualizers.get(coneWind.id);
      coneWind.updateVisualizer(visualizer);
    });
    
    const dirZControl = this.createRangeControl('Z方向:', -1, 1, coneWind.direction.z, (value) => {
      coneWind.direction.z = parseFloat(value);
      coneWind.direction.normalize();
      const visualizer = this.windFieldVisualizers.get(coneWind.id);
      coneWind.updateVisualizer(visualizer);
    });
    
    // 创建强度控制
    const strengthControl = this.createRangeControl('强度:', 0, 500, coneWind.strength, (value) => {
      coneWind.strength = parseFloat(value);
    });
    
    // 创建角度控制（弧度转换为度数显示）
    const angleControl = this.createRangeControl('角度:', 5, 90, coneWind.angle * (180 / Math.PI), (value) => {
      coneWind.angle = parseFloat(value) * (Math.PI / 180);
      const visualizer = this.windFieldVisualizers.get(coneWind.id);
      coneWind.updateVisualizer(visualizer);
    });
    
    // 创建范围控制
    const rangeControl = this.createRangeControl('范围:', 5, 30, coneWind.maxDistance, (value) => {
      coneWind.maxDistance = parseFloat(value);
      const visualizer = this.windFieldVisualizers.get(coneWind.id);
      coneWind.updateVisualizer(visualizer);
    });
    
    // 添加控制元素到容器
    fieldElement.appendChild(posXControl);
    fieldElement.appendChild(posYControl);
    fieldElement.appendChild(posZControl);
    fieldElement.appendChild(dirXControl);
    fieldElement.appendChild(dirYControl);
    fieldElement.appendChild(dirZControl);
    fieldElement.appendChild(strengthControl);
    fieldElement.appendChild(angleControl);
    fieldElement.appendChild(rangeControl);
    
    container.appendChild(fieldElement);
  }
  
  // 添加螺旋风场
  addSpiralWindField() {
    // 在场景中心附近随机生成一个螺旋风场
    const position = new THREE.Vector3(
      (Math.random() - 0.5) * 30,
      -20, // 从底部开始
      (Math.random() - 0.5) * 30
    );
    
    // 默认向上
    const direction = new THREE.Vector3(0, 1, 0);
    
    const strength = 2.0;
    const radius = 8.0;
    const rotationSpeed = 1.0;
    
    const spiralWind = new SpiralWindField(position, direction, strength, radius, rotationSpeed);
    this.app.particleSystem.addWindField(spiralWind);
    
    // 创建并添加可视化
    const visualizer = spiralWind.createVisualizer();
    this.app.scene.add(visualizer);
    this.windFieldVisualizers.set(spiralWind.id, visualizer);
    
    // 添加控制UI
    this.createSpiralWindControls(spiralWind);
  }
  
  // 创建螺旋风场的控制UI
  createSpiralWindControls(spiralWind) {
    const container = document.getElementById('spiral-wind-fields');
    
    const fieldElement = document.createElement('div');
    fieldElement.className = 'field-control';
    fieldElement.dataset.id = spiralWind.id;
    
    // 添加标题和删除按钮
    const header = document.createElement('div');
    header.className = 'field-header';
    
    const title = document.createElement('span');
    title.textContent = '螺旋风场';
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = '删除';
    removeBtn.addEventListener('click', () => {
      this.removeWindField(spiralWind.id, 'spiral-wind-fields');
    });
    
    header.appendChild(title);
    header.appendChild(removeBtn);
    
    fieldElement.appendChild(header);
    
    // 创建位置控制
    const posXControl = this.createRangeControl('X位置:', -50, 50, spiralWind.position.x, (value) => {
      spiralWind.position.x = parseFloat(value);
      const visualizer = this.windFieldVisualizers.get(spiralWind.id);
      spiralWind.updateVisualizer(visualizer);
    });
    
    const posYControl = this.createRangeControl('Y位置:', -50, 50, spiralWind.position.y, (value) => {
      spiralWind.position.y = parseFloat(value);
      const visualizer = this.windFieldVisualizers.get(spiralWind.id);
      spiralWind.updateVisualizer(visualizer);
    });
    
    const posZControl = this.createRangeControl('Z位置:', -50, 50, spiralWind.position.z, (value) => {
      spiralWind.position.z = parseFloat(value);
      const visualizer = this.windFieldVisualizers.get(spiralWind.id);
      spiralWind.updateVisualizer(visualizer);
    });
    
    // 创建方向控制
    const dirXControl = this.createRangeControl('X方向:', -1, 1, spiralWind.direction.x, (value) => {
      spiralWind.direction.x = parseFloat(value);
      spiralWind.direction.normalize();
      this.recreateSpiralVisualizer(spiralWind);
    });
    
    const dirYControl = this.createRangeControl('Y方向:', -1, 1, spiralWind.direction.y, (value) => {
      spiralWind.direction.y = parseFloat(value);
      spiralWind.direction.normalize();
      this.recreateSpiralVisualizer(spiralWind);
    });
    
    const dirZControl = this.createRangeControl('Z方向:', -1, 1, spiralWind.direction.z, (value) => {
      spiralWind.direction.z = parseFloat(value);
      spiralWind.direction.normalize();
      this.recreateSpiralVisualizer(spiralWind);
    });
    
    // 创建强度控制
    const strengthControl = this.createRangeControl('强度:', 0, 500, spiralWind.strength, (value) => {
      spiralWind.strength = parseFloat(value);
    });
    
    // 创建半径控制
    const radiusControl = this.createRangeControl('半径:', 1, 20, spiralWind.radius, (value) => {
      spiralWind.radius = parseFloat(value);
      spiralWind.maxDistance = parseFloat(value); // 更新最大距离
      this.recreateSpiralVisualizer(spiralWind);
    });
    
    // 创建旋转速度控制
    const rotationControl = this.createRangeControl('旋转速度:', 0.1, 3, spiralWind.rotationSpeed, (value) => {
      spiralWind.rotationSpeed = parseFloat(value);
    });
    
    // 添加控制元素到容器
    fieldElement.appendChild(posXControl);
    fieldElement.appendChild(posYControl);
    fieldElement.appendChild(posZControl);
    fieldElement.appendChild(dirXControl);
    fieldElement.appendChild(dirYControl);
    fieldElement.appendChild(dirZControl);
    fieldElement.appendChild(strengthControl);
    fieldElement.appendChild(radiusControl);
    fieldElement.appendChild(rotationControl);
    
    container.appendChild(fieldElement);
  }
  
  // 重新创建螺旋风场的可视化
  // 因为螺旋风场的可视化依赖于方向和半径，所以需要重建而不只是更新
  recreateSpiralVisualizer(spiralWind) {
    const oldVisualizer = this.windFieldVisualizers.get(spiralWind.id);
    
    if (oldVisualizer) {
      this.app.scene.remove(oldVisualizer);
    }
    
    const newVisualizer = spiralWind.createVisualizer();
    this.app.scene.add(newVisualizer);
    this.windFieldVisualizers.set(spiralWind.id, newVisualizer);
  }
  
  // 移除风场
  removeWindField(id, containerId) {
    // 从粒子系统中移除
    this.app.particleSystem.removeWindField(id);
    
    // 从场景中移除可视化
    const visualizer = this.windFieldVisualizers.get(id);
    if (visualizer) {
      this.app.scene.remove(visualizer);
      this.windFieldVisualizers.delete(id);
    }
    
    // 从UI中移除
    const container = document.getElementById(containerId);
    const element = container.querySelector(`[data-id="${id}"]`);
    if (element) {
      container.removeChild(element);
    }
  }
  
  // 设置粒子系统控制
  setupParticleControls() {
    const countInput = document.getElementById('particle-count');
    const sizeInput = document.getElementById('particle-size');
    const speedInput = document.getElementById('particle-speed');
    
    countInput.addEventListener('input', () => {
      const count = parseInt(countInput.value);
      this.app.particleSystem.setCount(count);
      document.getElementById('particle-count-value').textContent = count;
    });
    
    sizeInput.addEventListener('input', () => {
      const size = parseFloat(sizeInput.value);
      this.app.particleSystem.setSize(size);
      document.getElementById('particle-size-value').textContent = size;
    });
    
    speedInput.addEventListener('input', () => {
      const speed = parseFloat(speedInput.value);
      this.app.particleSystem.setSpeed(speed);
      document.getElementById('particle-speed-value').textContent = speed;
    });
  }
  
  // 创建范围控制UI元素
  createRangeControl(label, min, max, value, onChange) {
    const control = document.createElement('div');
    control.className = 'control';
    
    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    
    const input = document.createElement('input');
    input.type = 'range';
    input.min = min;
    input.max = max;
    input.step = (max - min) / 100;
    input.value = value;
    
    const valueDisplay = document.createElement('span');
    valueDisplay.textContent = value.toFixed(2);
    
    input.addEventListener('input', () => {
      const numValue = parseFloat(input.value);
      valueDisplay.textContent = numValue.toFixed(2);
      onChange(numValue);
    });
    
    control.appendChild(labelElement);
    control.appendChild(input);
    control.appendChild(valueDisplay);
    
    return control;
  }
} 