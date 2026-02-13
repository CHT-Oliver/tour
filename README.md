# Haotian’s Atlas

## Usage
- 直接打开 `index.html` 或用静态服务器访问即可。
- 如果浏览器阻止本地 `fetch`，请在项目根目录运行：
  - `python3 -m http.server 8000`
  - 然后访问 `http://localhost:8000/index.html`

## Add A New Place
1. 在 `data/places.json` 添加一条新对象：
   - `slug`: 纯英文小写，作为目录名与 URL 参数
   - `name_zh`, `name_en`: 中英文名称
   - `lat`, `lon`: 坐标
   - `visited`: `true` 才会在地图显示金色标记
   - `date_range`: 日期或范围
   - `tags`: 标签数组
   - `quote`: 可选一句话
   - `thoughts`: 多段文字数组
   - `photos`: 相对路径数组，例如 `assets/photos/<slug>/1.jpg`
2. 在 `assets/photos/<slug>/` 放入图片文件，对应 `photos` 字段。

## Notes
- 首页地图点位由 `data/places.json` 驱动。
- 详情页通过 `place.html?slug=<slug>` 加载对应内容。
