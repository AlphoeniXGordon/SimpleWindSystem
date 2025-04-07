/**
 * 粒子系统 - 处理场景中粒子的生成、更新和渲染
 */

class ParticleSystem {
  constructor(scene, count = 5000, size = 0.5, speed = 1) {
    this.scene = scene;
    this.count = count;
    this.size = size;
    this.speed = speed;
    
    this.boundingBox = new THREE.Box3(
      new THREE.Vector3(-50, -50, -50),
      new THREE.Vector3(50, 50, 50)
    );
    
    this.windFields = [];
    
    this.init();
  }
  
  // 初始化粒子系统
  init() {
    // 创建粒子几何体
    this.geometry = new THREE.BufferGeometry();
    
    // 为每个粒子创建位置、速度和颜色属性
    this.positions = new Float32Array(this.count * 3);
    this.velocities = new Float32Array(this.count * 3);
    this.colors = new Float32Array(this.count * 3);
    
    // 创建粒子材质
    this.material = new THREE.PointsMaterial({
      size: this.size,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    
    // 初始化粒子属性
    this.initParticles();
    
    // 创建粒子系统网格
    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
  }
  
  // 初始化所有粒子的属性
  initParticles() {
    for (let i = 0; i < this.count; i++) {
      this.initParticle(i);
    }
    
    // 将位置和颜色数据添加到几何体
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
  }
  
  // 初始化单个粒子
  initParticle(index) {
    const i3 = index * 3;
    
    // 随机位置在边界盒内
    this.positions[i3] = Math.random() * this.boundingBox.max.x * 2 - this.boundingBox.max.x;
    this.positions[i3 + 1] = Math.random() * this.boundingBox.max.y * 2 - this.boundingBox.max.y;
    this.positions[i3 + 2] = Math.random() * this.boundingBox.max.z * 2 - this.boundingBox.max.z;
    
    // 初始速度很小，主要由风场决定
    this.velocities[i3] = (Math.random() - 0.5) * 0.1;
    this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.1;
    this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;
    
    // 随机颜色，偏蓝白色
    this.colors[i3] = 0.7 + Math.random() * 0.3; // R
    this.colors[i3 + 1] = 0.8 + Math.random() * 0.2; // G
    this.colors[i3 + 2] = 1.0; // B
  }
  
  // 设置粒子数量
  setCount(count) {
    if (count === this.count) return;
    
    // 保存旧数据
    const oldPositions = this.positions;
    const oldVelocities = this.velocities;
    const oldColors = this.colors;
    
    // 创建新的数组
    this.count = count;
    this.positions = new Float32Array(this.count * 3);
    this.velocities = new Float32Array(this.count * 3);
    this.colors = new Float32Array(this.count * 3);
    
    // 复制旧数据，如果新数组更大则初始化新粒子
    const copyCount = Math.min(oldPositions.length / 3, this.count);
    
    for (let i = 0; i < copyCount; i++) {
      const i3 = i * 3;
      this.positions[i3] = oldPositions[i3];
      this.positions[i3 + 1] = oldPositions[i3 + 1];
      this.positions[i3 + 2] = oldPositions[i3 + 2];
      
      this.velocities[i3] = oldVelocities[i3];
      this.velocities[i3 + 1] = oldVelocities[i3 + 1];
      this.velocities[i3 + 2] = oldVelocities[i3 + 2];
      
      this.colors[i3] = oldColors[i3];
      this.colors[i3 + 1] = oldColors[i3 + 1];
      this.colors[i3 + 2] = oldColors[i3 + 2];
    }
    
    // 初始化新粒子
    for (let i = copyCount; i < this.count; i++) {
      this.initParticle(i);
    }
    
    // 更新几何体属性
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
  }
  
  // 设置粒子大小
  setSize(size) {
    this.size = size;
    this.material.size = size;
  }
  
  // 设置粒子速度
  setSpeed(speed) {
    this.speed = speed;
  }
  
  // 添加风场
  addWindField(windField) {
    this.windFields.push(windField);
  }
  
  // 移除风场
  removeWindField(windFieldId) {
    const index = this.windFields.findIndex(field => field.id === windFieldId);
    if (index !== -1) {
      this.windFields.splice(index, 1);
    }
  }
  
  // 更新粒子系统
  update(deltaTime) {
    // 应用风场力并更新粒子位置
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      
      // 获取当前位置和速度
      const position = new THREE.Vector3(
        this.positions[i3],
        this.positions[i3 + 1],
        this.positions[i3 + 2]
      );
      
      const velocity = new THREE.Vector3(
        this.velocities[i3],
        this.velocities[i3 + 1],
        this.velocities[i3 + 2]
      );
      
      // 应用所有风场的力
      let resultantForce = new THREE.Vector3(0, 0, 0);
      
      for (const windField of this.windFields) {
        if (windField.enabled) {
          resultantForce.add(windField.calculateForce(position));
        }
      }
      
      // 应用阻力（使粒子逐渐减速，除非受到风场的持续作用）
      // 调整阻力系数，让粒子更灵敏地响应风场变化
      velocity.multiplyScalar(0.95);
      
      // 更新速度（应用风场力），增加风场影响因子
      velocity.add(resultantForce.multiplyScalar(deltaTime * this.speed * 1.5));
      
      // 限制最大速度
      const maxSpeed = 12 * this.speed; // 增加最大速度
      if (velocity.length() > maxSpeed) {
        velocity.normalize().multiplyScalar(maxSpeed);
      }
      
      // 更新位置
      position.add(velocity.clone().multiplyScalar(deltaTime));
      
      // 检查边界，如果粒子超出范围，将其重置到另一侧
      if (position.x < this.boundingBox.min.x) position.x = this.boundingBox.max.x;
      else if (position.x > this.boundingBox.max.x) position.x = this.boundingBox.min.x;
      
      if (position.y < this.boundingBox.min.y) position.y = this.boundingBox.max.y;
      else if (position.y > this.boundingBox.max.y) position.y = this.boundingBox.min.y;
      
      if (position.z < this.boundingBox.min.z) position.z = this.boundingBox.max.z;
      else if (position.z > this.boundingBox.max.z) position.z = this.boundingBox.min.z;
      
      // 更新颜色，基于速度，更明显的颜色变化
      const speed = velocity.length() / maxSpeed;
      this.colors[i3] = 0.6 + speed * 0.4; // R 随速度增加
      this.colors[i3 + 1] = 0.7 + speed * 0.3; // G 随速度增加
      this.colors[i3 + 2] = 0.8 + speed * 0.2; // B 随速度增加
      
      // 更新粒子数据
      this.positions[i3] = position.x;
      this.positions[i3 + 1] = position.y;
      this.positions[i3 + 2] = position.z;
      
      this.velocities[i3] = velocity.x;
      this.velocities[i3 + 1] = velocity.y;
      this.velocities[i3 + 2] = velocity.z;
    }
    
    // 通知Three.js更新粒子位置和颜色
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }
  
  // 在销毁系统时清理资源
  dispose() {
    this.scene.remove(this.points);
    this.geometry.dispose();
    this.material.dispose();
  }
} 