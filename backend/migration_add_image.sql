-- 为 laptops 表添加 image_url 字段
ALTER TABLE laptops ADD COLUMN image_url VARCHAR(500) DEFAULT NULL COMMENT '笔记本图片URL';
