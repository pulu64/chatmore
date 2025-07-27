# 数据库模型改进总结

## 主要改进

### 1. 字段类型优化
- **状态字段**: 将数字状态改为字符串枚举，提高可读性
  - 好友申请状态: `0,1,2,3` → `'pending','accepted','rejected','ignored'`
  - 消息状态: `0,1` → `'unread','read'`
  - 消息类型: `0,1,2` → `'text','image','file'`
  - 群成员静音: `0,1` → `true,false`

### 2. 字段验证和约束
- 添加了 `required` 字段验证
- 添加了字符串长度限制 (`minlength`, `maxlength`)
- 添加了邮箱格式验证 (`lowercase`, `trim`)
- 添加了数字范围验证 (`min`)

### 3. 引用关系修复
- 修复了 `Group_Request` 和 `Group_Invite` 中 `groupId` 的错误引用
- 从 `ref: 'User'` 改为 `ref: 'Group'`

### 4. 索引优化
- 为常用查询字段添加了索引
- 添加了复合索引优化查询性能
- 添加了唯一索引防止重复数据

### 5. 枚举值规范化
- 性别: `['male', 'female', 'asexual']`
- 用户状态: `['active', 'offline', 'busy']`
- 群成员角色: `['normal', 'admin', 'owner']`

## 修改的文件

### 后端文件
1. `src/models/dbModel.js` - 数据库模型定义和索引
2. `src/models/fakee.js` - 测试数据生成适配
3. `src/server/socket.js` - Socket事件处理逻辑
4. `src/server/controllers/group.js` - 群组控制器
5. `src/server/controllers/friend.js` - 好友控制器
6. `src/server/controllers/chat.js` - 聊天控制器

### 前端文件
1. `src/components/MessageCard.vue` - 消息组件类型判断
2. `src/components/ContactCard.vue` - 联系人状态显示
3. `src/types/chat.d.ts` - 聊天相关类型定义
4. `src/types/user.d.ts` - 用户相关类型定义

## 具体变更详情

### 后端变更

#### 1. dbModel.js
- 修复了 `Group_Request` 和 `Group_Invite` 的 `groupId` 引用错误
- 将所有状态字段从 `Number` 改为 `String` 枚举
- 将 `isMuted` 从 `Number` 改为 `Boolean`
- 添加了字段验证和约束
- 添加了15个索引优化查询性能

#### 2. fakee.js
- 更新了测试数据生成逻辑
- 将状态生成从数字改为字符串枚举
- 将消息类型生成从数字改为字符串枚举
- 将 `isMuted` 生成从数字改为布尔值

#### 3. socket.js
- 更新了状态判断逻辑
- 将 `state === 1` 改为 `state === 'accepted'`
- 将 `state === 2` 改为 `state === 'rejected'`
- 将 `state === 3` 改为 `state === 'ignored'`

#### 4. group.js
- 更新了群组申请和邀请的状态处理
- 将查询条件中的数字状态改为字符串状态
- 更新了状态判断逻辑

#### 5. friend.js
- 更新了好友申请的状态处理
- 将查询条件中的数字状态改为字符串状态
- 更新了状态判断逻辑

#### 6. chat.js
- 更新了消息发送时的状态设置
- 将 `state: 0` 改为 `state: 'unread'`
- 更新了消息类型注释

### 前端变更

#### 1. MessageCard.vue
- 更新了消息类型判断逻辑
- 将 `messageType === 0` 改为 `messageType === 'text'`
- 将 `messageType === 1` 改为 `messageType === 'image'`
- 将 `messageType === 2` 改为 `messageType === 'file'`

#### 2. ContactCard.vue
- 更新了状态显示逻辑
- 将 `state === 1` 改为 `state === 'accepted'`
- 将 `state === 2` 改为 `state === 'rejected'`
- 将 `state === 3` 改为 `state === 'ignored'`
- 将 `state !== 0` 改为 `state !== 'pending'`

#### 3. chat.d.ts
- 更新了所有接口的状态字段类型
- 将 `state: number` 改为 `state: 'pending' | 'accepted' | 'rejected' | 'ignored'`
- 将 `type: number` 改为 `type: 'text' | 'image' | 'file'`
- 将 `isMuted: number` 改为 `isMuted: boolean`
- 将 `role: string` 改为 `role: 'normal' | 'admin' | 'owner'`

#### 4. user.d.ts
- 更新了用户状态字段类型
- 将 `state: string` 改为 `state: 'active' | 'offline' | 'busy'`
- 将 `gender: string` 改为 `gender: 'male' | 'female' | 'asexual'`

## 性能优化

### 索引策略
- **用户表**: `username`, `email`, `state`
- **好友表**: `userId+friendId`(唯一), `userId`, `friendId`
- **消息表**: `senderId+receiverId`, `receiverId+state`, `timestamp`
- **群组表**: `createdBy`, `groupName`
- **群成员表**: `groupId+userId`(唯一), `groupId`, `userId`

### 查询优化
- 使用复合索引减少查询时间
- 添加唯一约束防止数据重复
- 优化字段类型减少存储空间

## 数据一致性

### 约束改进
- 添加必填字段验证
- 字符串长度限制
- 枚举值验证
- 唯一性约束

### 引用完整性
- 修复了错误的模型引用关系
- 确保外键引用的正确性

## 向后兼容性

### 数据迁移
如果需要迁移现有数据，需要执行以下步骤：
1. 备份现有数据库
2. 更新状态字段值
3. 更新消息类型字段值
4. 更新布尔字段值

### 迁移脚本示例
```javascript
// 状态字段迁移
db.friend_requests.updateMany(
  { state: 0 }, 
  { $set: { state: 'pending' } }
);
db.friend_requests.updateMany(
  { state: 1 }, 
  { $set: { state: 'accepted' } }
);
db.friend_requests.updateMany(
  { state: 2 }, 
  { $set: { state: 'rejected' } }
);
db.friend_requests.updateMany(
  { state: 3 }, 
  { $set: { state: 'ignored' } }
);

// 消息状态迁移
db.private_messages.updateMany(
  { state: 0 }, 
  { $set: { state: 'unread' } }
);
db.private_messages.updateMany(
  { state: 1 }, 
  { $set: { state: 'read' } }
);

// 消息类型迁移
db.private_messages.updateMany(
  { type: 0 }, 
  { $set: { type: 'text' } }
);
db.private_messages.updateMany(
  { type: 1 }, 
  { $set: { type: 'image' } }
);
db.private_messages.updateMany(
  { type: 2 }, 
  { $set: { type: 'file' } }
);

// 群成员静音状态迁移
db.group_members.updateMany(
  { isMuted: 0 }, 
  { $set: { isMuted: false } }
);
db.group_members.updateMany(
  { isMuted: 1 }, 
  { $set: { isMuted: true } }
);
```

## 建议

1. **测试**: 在部署前充分测试所有功能
2. **备份**: 确保数据库备份完整
3. **监控**: 监控查询性能变化
4. **文档**: 更新API文档反映新的字段类型
5. **代码审查**: 确保所有相关代码都已更新 