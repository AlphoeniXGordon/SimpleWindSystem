/**
 * 风场系统 - 定义不同类型的风场及其对粒子的影响
 */

// 风场基类
class WindField {
  constructor(position = new THREE.Vector3(0, 0, 0), strength = 1.0) {
    this.position = position;
    this.strength = strength;
    this.enabled = true;
    this.maxDistance = 10; // 风场影响的最大距离
    this.id = Math.random().toString(36).substr(2, 9); // 生成唯一ID
  }

  // 计算风场在指定位置的力
  calculateForce(particlePosition) {
    return new THREE.Vector3(0, 0, 0);
  }

  // 获取粒子到风场的距离
  getDistance(particlePosition) {
    return this.position.distanceTo(particlePosition);
  }

  // 根据距离计算衰减系数
  getAttenuation(distance) {
    if (distance >= this.maxDistance) return 0;
    return 1 - (distance / this.maxDistance);
  }

  // 创建风场的可视化表示
  createVisualizer() {
    return null;
  }

  // 更新风场的可视化表示
  updateVisualizer() {
    // 由子类实现
  }
}

// 全局风场 - 应用于整个场景的恒定方向
class GlobalWindField extends WindField {
  constructor(direction = new THREE.Vector3(0, 0, 0), strength = 1.0) {
    super(new THREE.Vector3(0, 0, 0), strength);
    this.direction = direction.normalize();
    this.maxDistance = Infinity; // 全局风场没有距离限制
  }

  calculateForce(particlePosition) {
    return this.direction.clone().multiplyScalar(this.strength);
  }

  createVisualizer() {
    // 创建一个箭头表示全局风场方向
    const dir = this.direction.clone().normalize();
    const origin = new THREE.Vector3(0, 0, 0);
    const length = 5;
    const hex = 0x00ffff;
    
    // 增加箭头的头部大小，使其更明显
    const headLength = length * 0.3;
    const headWidth = headLength * 0.6;
    
    const arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex, headLength, headWidth);
    arrowHelper.visible = this.enabled;
    
    return arrowHelper;
  }

  updateVisualizer(visualizer) {
    if (!visualizer) return;
    
    visualizer.setDirection(this.direction.normalize());
    // 箭头长度与风场强度成正比
    const length = Math.min(5 + this.strength * 0.1, 15);
    visualizer.setLength(length, length * 0.3, length * 0.3 * 0.6);
    visualizer.visible = this.enabled;
  }
}

// 点风场 - 从中心点向外扩散或向内收缩
class PointWindField extends WindField {
  constructor(position = new THREE.Vector3(0, 0, 0), strength = 1.0, isOutward = true) {
    super(position, strength);
    this.isOutward = isOutward; // true表示向外扩散，false表示向内收缩
  }

  calculateForce(particlePosition) {
    const distance = this.getDistance(particlePosition);
    
    if (distance < 0.1 || distance > this.maxDistance) {
      return new THREE.Vector3(0, 0, 0);
    }
    
    // 计算方向向量（从风场中心指向粒子或相反）
    const direction = new THREE.Vector3().subVectors(particlePosition, this.position).normalize();
    
    // 如果是向内的风场，反转方向
    if (!this.isOutward) {
      direction.negate();
    }
    
    // 应用衰减和强度
    return direction.multiplyScalar(this.strength * this.getAttenuation(distance));
  }

  createVisualizer() {
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    const material = new THREE.MeshBasicMaterial({ 
      color: this.isOutward ? 0xff5722 : 0x2196f3,
      transparent: true,
      opacity: 0.7
    });
    
    const sphere = new THREE.Mesh(geometry, material);
    
    // 添加辅助线表示风场影响范围
    const wireframe = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.SphereGeometry(1, 16, 8)),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 })
    );
    
    // 缩放线框以匹配maxDistance
    wireframe.scale.set(
      this.maxDistance,
      this.maxDistance,
      this.maxDistance
    );
    
    const group = new THREE.Group();
    group.add(sphere);
    group.add(wireframe);
    // 设置整个组的位置
    group.position.copy(this.position);
    group.visible = this.enabled;
    
    return group;
  }

  updateVisualizer(visualizer) {
    if (!visualizer) return;
    
    visualizer.position.copy(this.position);
    
    // 更新球体颜色
    if (visualizer.children[0]) {
      visualizer.children[0].material.color.set(this.isOutward ? 0xff5722 : 0x2196f3);
      // 重置子对象的本地位置，确保它们在Group的原点
      visualizer.children[0].position.set(0, 0, 0);
    }
    
    // 更新范围线框
    if (visualizer.children[1]) {
      visualizer.children[1].scale.set(
        this.maxDistance,
        this.maxDistance,
        this.maxDistance
      );
      // 重置子对象的本地位置，确保它们在Group的原点
      visualizer.children[1].position.set(0, 0, 0);
    }
    
    visualizer.visible = this.enabled;
  }
}

// 锥体风场 - 类似电风扇，沿着一个方向吹
class ConeWindField extends WindField {
  constructor(position = new THREE.Vector3(0, 0, 0), direction = new THREE.Vector3(1, 0, 0), strength = 1.0, angle = Math.PI/4) {
    super(position, strength);
    this.direction = direction.normalize();
    this.angle = angle; // 锥体的角度（弧度）
    this.maxDistance = 15; // 锥体风场的默认最大影响距离
  }

  calculateForce(particlePosition) {
    // 计算粒子相对于风场起点的向量
    const toParticle = new THREE.Vector3().subVectors(particlePosition, this.position);
    const distance = toParticle.length();
    
    if (distance > this.maxDistance || distance < 0.1) {
      return new THREE.Vector3(0, 0, 0);
    }
    
    // 先复制一份方向向量，避免修改原向量
    const particleDir = toParticle.clone().normalize();
    
    // 计算粒子与风向的夹角
    const cosAngle = particleDir.dot(this.direction);
    const particleAngle = Math.acos(Math.max(-1, Math.min(1, cosAngle))); // 确保在有效范围内
    
    // 如果粒子在锥体范围外，不受影响
    if (particleAngle > this.angle) {
      return new THREE.Vector3(0, 0, 0);
    }
    
    // 在锥体内的衰减系数，越靠近锥体轴线，影响越大
    const coneAttenuation = Math.pow(1 - (particleAngle / this.angle), 2); // 使用二次方增强中心效果
    
    // 根据距离计算力的大小（距离越近越大）
    const distanceAttenuation = 1 - Math.pow(distance / this.maxDistance, 0.75); // 减弱远处衰减
    
    // 应用距离衰减和方向强度，增强力的影响（乘以3.0）
    return this.direction.clone().multiplyScalar(
      this.strength * distanceAttenuation * coneAttenuation * 3.0
    );
  }

  createVisualizer() {
    const group = new THREE.Group();
    
    // 创建一个锥体表示风场方向和范围
    const height = this.maxDistance;
    const radius = Math.tan(this.angle) * height;
    
    // 使用更标准的参数创建锥体
    const coneGeometry = new THREE.ConeGeometry(radius, height, 32);
    
    // 旋转锥体，使其尖端朝向Z轴正方向
    // 这样旋转可以更容易地将锥体对准风场方向
    coneGeometry.rotateX(-Math.PI / 2);
    
    // 移动锥体几何体的原点到锥尖
    coneGeometry.translate(0, 0, height/2);
    
    const coneMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00, // 绿色
      transparent: true,
      opacity: 0.35,
      wireframe: true
    });
    
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    
    // 创建一个球体表示风场起始点
    const sphereGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x4caf50 });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    
    group.add(cone);
    group.add(sphere);
    
    // 设置位置
    group.position.copy(this.position);
    
    // 计算旋转四元数，使锥体指向风场方向
    // 关键修复：从Z轴正方向旋转到风场方向 (而不是从Z轴负方向)
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), this.direction);
    group.setRotationFromQuaternion(quaternion);
    
    group.visible = this.enabled;
    
    return group;
  }

  updateVisualizer(visualizer) {
    if (!visualizer) return;
    
    visualizer.position.copy(this.position);
    
    // 确保子对象位置正确
    if (visualizer.children[0]) {
      visualizer.children[0].position.set(0, 0, 0);
    }
    if (visualizer.children[1]) {
      visualizer.children[1].position.set(0, 0, 0);
    }
    
    // 更新锥体尺寸
    if (visualizer.children[0]) {
      // 重新生成几何体而不是缩放，以确保锥体形状保持一致
      // 这是为了避免非均匀缩放导致的形状变形
      const cone = visualizer.children[0];
      const oldGeometry = cone.geometry;
      
      const height = this.maxDistance;
      const radius = Math.tan(this.angle) * height;
      
      // 创建新的锥体几何体
      const newGeometry = new THREE.ConeGeometry(radius, height, 32);
      newGeometry.rotateX(-Math.PI / 2);
      newGeometry.translate(0, 0, height/2);
      
      // 更新几何体
      cone.geometry.dispose();
      cone.geometry = newGeometry;
    }
    
    // 更新方向
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), this.direction);
    visualizer.setRotationFromQuaternion(quaternion);
    
    visualizer.visible = this.enabled;
  }
}

// 螺旋风场 - 类似龙卷风，具有旋转和上升作用
class SpiralWindField extends WindField {
  constructor(position = new THREE.Vector3(0, 0, 0), direction = new THREE.Vector3(0, 1, 0), strength = 1.0, radius = 5, rotationSpeed = 1) {
    super(position, strength);
    this.direction = direction.normalize(); // 螺旋向上的方向
    this.radius = radius; // 螺旋风场的半径
    this.rotationSpeed = rotationSpeed; // 旋转速度
    this.maxDistance = radius; // 螺旋风场的最大影响距离与半径相同
  }

  calculateForce(particlePosition) {
    // 将粒子位置转换到风场的局部坐标系
    const localPosition = new THREE.Vector3().subVectors(particlePosition, this.position);
    
    // 计算粒子到风场中心轴的距离（忽略高度）
    const horizontalDir = new THREE.Vector3(localPosition.x, 0, localPosition.z);
    const horizontalDistance = horizontalDir.length();
    
    // 如果粒子在螺旋风场范围外，不受影响
    if (horizontalDistance > this.radius) {
      return new THREE.Vector3(0, 0, 0);
    }
    
    // 计算向上的力（与direction方向一致）
    const upwardForce = this.direction.clone().multiplyScalar(this.strength * 0.5);
    
    // 计算旋转的力（垂直于指向中心的方向）
    let rotationForce = new THREE.Vector3();
    if (horizontalDistance > 0.1) {
      // 归一化水平方向
      const normalizedHorizontal = horizontalDir.clone().normalize();
      
      // 计算垂直于水平方向的向量（旋转90度）
      rotationForce = new THREE.Vector3(-normalizedHorizontal.z, 0, normalizedHorizontal.x);
      
      // 旋转力与距离中心的距离成正比，越靠近中心旋转力越小
      const rotationStrength = (horizontalDistance / this.radius) * this.strength * this.rotationSpeed;
      rotationForce.multiplyScalar(rotationStrength);
    }
    
    // 合并上升力和旋转力
    return upwardForce.add(rotationForce);
  }

  // 生成螺旋线的点
  generateSpiralPoints() {
    const points = [];
    const height = 10; // 螺旋体的高度
    const turns = 5;
    
    // 确保螺旋线和圆柱体有相同的高度
    const basePosition = new THREE.Vector3(0, 0, 0);
    
    for (let i = 0; i <= turns * 32; i++) {
      const t = i / (turns * 32);
      const angle = turns * Math.PI * 2 * t;
      const radiusAt = this.radius * (1 - 0.3 * t); // 螺旋逐渐变窄
      
      const x = radiusAt * Math.cos(angle);
      const y = height * t;
      const z = radiusAt * Math.sin(angle);
      
      points.push(new THREE.Vector3(x, y, z));
    }
    
    return points;
  }

  createVisualizer() {
    const group = new THREE.Group();
    
    // 创建螺旋线表示风场
    const curve = new THREE.CatmullRomCurve3(this.generateSpiralPoints());
    const geometry = new THREE.TubeGeometry(curve, 100, 0.2, 8, false);
    const material = new THREE.MeshBasicMaterial({
      color: 0x9c27b0,
      transparent: true,
      opacity: 0.5
    });
    
    const spiral = new THREE.Mesh(geometry, material);
    
    // 创建一个圆柱体表示风场范围
    const height = 10; // 与generateSpiralPoints中的高度保持一致
    const cylinderGeometry = new THREE.CylinderGeometry(this.radius, this.radius, height, 32, 1, true);
    // 将圆柱体的底部对齐到原点
    cylinderGeometry.translate(0, height/2, 0);
    
    const cylinderMaterial = new THREE.MeshBasicMaterial({
      color: 0x9c27b0,
      transparent: true,
      opacity: 0.1,
      wireframe: true,
      side: THREE.DoubleSide
    });
    
    const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    
    group.add(spiral);
    group.add(cylinder);
    
    // 设置位置
    group.position.copy(this.position);
    
    // 计算旋转四元数，使螺旋指向设定的方向
    if (!this.direction.equals(new THREE.Vector3(0, 1, 0))) {
      const quaternion = new THREE.Quaternion();
      quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), this.direction);
      group.setRotationFromQuaternion(quaternion);
    }
    
    group.visible = this.enabled;
    
    return group;
  }

  updateVisualizer(visualizer) {
    if (!visualizer) return;
    
    visualizer.position.copy(this.position);
    
    // 重置子对象的本地位置，确保它们在Group的原点
    if (visualizer.children[0]) {
      visualizer.children[0].position.set(0, 0, 0);
    }
    if (visualizer.children[1]) {
      visualizer.children[1].position.set(0, 0, 0);
    }
    
    // 如果半径或方向发生变化，需要重新创建可视化
    // 目前只更新位置和可见性
    
    visualizer.visible = this.enabled;
  }
} 