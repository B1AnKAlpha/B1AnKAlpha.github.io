// 初始化 ECharts 实例
var myChart = echarts.init(document.getElementById('worldMap'));
var pieChart = echarts.init(document.getElementById('pieChart'));
var barChart = echarts.init(document.getElementById('barChart'));
var distChart = echarts.init(document.getElementById('distChart'));
var provinceMapChart = echarts.init(document.getElementById('provinceMap'));
var provinceBarChart = echarts.init(document.getElementById('provinceBarChart'));

// 数据配置 (真实统计数据)
// 省份名称映射表
const provinceMap = {
    "Fujian": "福建", "Jiangxi": "江西", "Guangxi": "广西", "Zhejiang": "浙江", 
    "Hainan": "海南", "Guangdong": "广东", "Yunnan": "云南", "Guizhou": "贵州", 
    "Hunan": "湖南", "Chongqing": "重庆", "Sichuan": "四川", "Shaanxi": "陕西", 
    "Heilongjiang": "黑龙江", "Jilin": "吉林", "Liaoning": "辽宁", "Hubei": "湖北", 
    "Beijing": "北京", "Hebei": "河北", "Anhui": "安徽", "Henan": "河南", 
    "Shanxi": "山西", "Inner Mongolia": "内蒙古", "Shandong": "山东", "Jiangsu": "江苏", 
    "Tianjin": "天津", "Ningxia": "宁夏", "Gansu": "甘肃", "Tibet": "西藏", 
    "Xinjiang": "新疆", "Shanghai": "上海", "Qinghai": "青海"
};

// 数据通过 assets/data/metrics.js 注入
if (typeof rawData === 'undefined' || typeof cityData === 'undefined') {
    console.error('metrics.js 未加载，无法渲染指标数据');
}

const themeList = ['population', 'gdp', 'students'];

// 辅助函数：获取排序后的前5名数据
function getTop5(type) {
    const data = rawData[type] || {};
    const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return sorted.map(item => ({ name: provinceMap[item[0]] || item[0], value: item[1] }));
}

const dataConfig = {
    population: {
        title: "人口总量",
        color: ['#1abc9c', '#16a085', '#7ee0c2'],
        desc: "常住人口总量（万人），统计来源：各省/地级市统计公报。",
        unit: "万人",
        max: 14000,
        pieData: getTop5('population'),
        mapColor: '#1abc9c',
        pieces: [
            {min: 10000, max: 20000, label: '> 1亿', color: '#0b5345'},
            {min: 7000, max: 10000, label: '7000-10000', color: '#117a65'},
            {min: 5000, max: 7000, label: '5000-7000', color: '#16a085'},
            {min: 2000, max: 5000, label: '2000-5000', color: '#1abc9c'},
            {min: 0, max: 2000, label: '< 2000', color: '#6fd2b6'}
        ]
    },
    gdp: {
        title: "地区生产总值",
        color: ['#e67e22', '#d35400', '#f6b47a'],
        desc: "地区生产总值（亿元，当年价）。数据来源：各省/地级市统计公报。",
        unit: "亿元",
        max: 150000,
        pieData: getTop5('gdp'),
        mapColor: '#e67e22',
        pieces: [
            {min: 90000, max: 200000, label: '> 9万亿', color: '#9c640c'},
            {min: 60000, max: 90000, label: '6-9万亿', color: '#b9770e'},
            {min: 30000, max: 60000, label: '3-6万亿', color: '#e67e22'},
            {min: 10000, max: 30000, label: '1-3万亿', color: '#f0b27a'},
            {min: 0, max: 10000, label: '< 1万亿', color: '#f8cfa7'}
        ]
    },
    students: {
        title: "在校生人数",
        color: ['#9b59b6', '#8e44ad', '#d7bde2'],
        desc: "在校生人数（万人），来源：各地教育统计。",
        unit: "万人",
        max: 1100,
        pieData: getTop5('students'),
        mapColor: '#9b59b6',
        pieces: [
            {min: 800, max: 1500, label: '> 800', color: '#5b2c6f'},
            {min: 500, max: 800, label: '500-800', color: '#7d3c98'},
            {min: 300, max: 500, label: '300-500', color: '#9b59b6'},
            {min: 100, max: 300, label: '100-300', color: '#c39bd3'},
            {min: 0, max: 100, label: '< 100', color: '#e8d6f0'}
        ]
    }
};

// 为省级图例动态分段
function buildProvincePieces(data, config) {
    const base = config.pieces || [];
    if (!data || !data.length) return base;
    const values = data
        .map(d => Number(d.value))
        .filter(v => !isNaN(v));
    if (!values.length) return base;
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    if (minVal === maxVal) {
        const color = (base[0] && base[0].color) || config.mapColor || '#1abc9c';
        return [{ min: minVal, max: maxVal, label: `${minVal}`, color }];
    }
    const step = (maxVal - minVal) / 5;
    const colors = (base.length ? base : [{ color: config.mapColor }]).map(p => p.color);
    const pieces = [];
    for (let i = 0; i < 5; i++) {
        const pMin = minVal + step * i;
        const pMax = i === 4 ? maxVal : minVal + step * (i + 1);
        const color = colors[i] || colors[colors.length - 1] || '#888';
        pieces.push({
            min: Number(pMin.toFixed(2)),
            max: Number(pMax.toFixed(2)),
            label: `${Math.round(pMin)}-${Math.round(pMax)}`,
            color
        });
    }
    return pieces;
}

// 加载中国地图数据
// 使用 GeoJSON 格式的中国地图
$.get('https://cdn.jsdelivr.net/npm/echarts@4.9.0/map/json/china.json', function (chinaJson) {
    echarts.registerMap('china', chinaJson);
    
    renderMap('population'); // 默认渲染人口
    renderCharts('population');
    
    // 监听地图缩放事件，更新比例尺
    myChart.on('georoam', function () {
        updateScaleBar();
    });
    // 初始化比例尺
    setTimeout(updateScaleBar, 500);
});

// 渲染地图函数
function renderMap(type) {
    const config = dataConfig[type] || dataConfig['population'];
    
    // 准备地图数据
    let mapData = [];
    const sourceData = rawData[type];
    if (sourceData) {
        for (const [engName, value] of Object.entries(sourceData)) {
            const cnName = provinceMap[engName];
            if (cnName) {
                mapData.push({ name: cnName, value: value });
            }
        }
    }

    const option = {
        backgroundColor: '#fff',
        title: [
            {
                text: config.title,
                left: 'center',
                top: 20,
                textStyle: {
                    color: '#333',
                    fontSize: 24,
                    fontWeight: 'bold'
                }
            },
            {
                text: '图例',
                left: 20,
                bottom: 145,
                textStyle: {
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: '#333'
                }
            }
        ],
        tooltip: {
            trigger: 'item',
            formatter: function(params) {
                if (params.value) {
                    return params.name + ': ' + params.value + ' ' + (config.unit || '');
                }
                return params.name + ': 暂无数据';
            }
        },
        geo: {
            map: 'china',
            roam: true,
            zoom: 1.2,
            label: {
                show: true,
                color: '#555',
                fontSize: 10
            },
            emphasis: {
                label: { show: true, color: '#222', fontWeight: 'bold' },
                itemStyle: { areaColor: '#eee' }
            },
            itemStyle: {
                areaColor: '#f3f3f3',
                borderColor: '#ccc'
            }
        },
        visualMap: {
            type: 'piecewise',
            pieces: config.pieces,
            left: 20,
            bottom: 20,
            textStyle: { color: '#333' },
            itemWidth: 20,
            itemHeight: 14,
            itemGap: 10
        },
        series: [
            {
                name: config.title,
                type: 'map',
                geoIndex: 0,
                data: mapData
            }
        ]
    };
    myChart.setOption(option);
    
    // 渲染后更新比例尺
    setTimeout(updateScaleBar, 100);
}

// 渲染图表函数
function renderCharts(type) {
    const config = dataConfig[type] || dataConfig['population'];

    // 饼图
    pieChart.setOption({
        color: config.color,
        tooltip: { trigger: 'item' },
        legend: { top: '5%', left: 'center', show: false },
        series: [{
            name: config.title,
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
            label: { show: true, position: 'outside', formatter: '{b}: {c}' + (config.unit || '') },
            data: config.pieData.length ? config.pieData : [{value:0, name:'暂无数据'}]
        }]
    });

    // 柱状图 (Top 5 对比)
    const top5Data = config.pieData;
    barChart.setOption({
        color: [config.mapColor],
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '15%', bottom: '3%', containLabel: true },
        xAxis: { type: 'value', name: config.unit || '' },
        yAxis: { type: 'category', data: top5Data.map(item => item.name).reverse() },
        series: [{
            data: top5Data.map(item => item.value).reverse(),
            type: 'bar',
            showBackground: true,
            backgroundStyle: { color: 'rgba(180, 180, 180, 0.2)' },
            label: { show: true, position: 'right' }
        }]
    });

    // 数据分布直方图 (基于分级配置)
    const sourceData = rawData[type] || {};
    const values = Object.values(sourceData);
    const distData = config.pieces.map(piece => {
        const count = values.filter(v => v >= piece.min && v <= piece.max).length;
        return { name: piece.label, value: count, color: piece.color };
    });

    distChart.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '10%', bottom: '3%', containLabel: true },
        xAxis: { 
            type: 'category', 
            data: distData.map(d => d.name),
            axisLabel: { interval: 0, fontSize: 10 }
        },
        yAxis: { type: 'value', name: '省份数' },
        series: [{
            data: distData.map(d => ({
                value: d.value,
                itemStyle: { color: d.color }
            })),
            type: 'bar',
            label: { show: true, position: 'top' }
        }]
    });
}

// 切换图层逻辑
function switchLayer(type) {
    // 更新 UI 状态
    document.querySelectorAll('.nav-btn').forEach(el => {
        el.classList.remove('active');
        el.classList.remove('population', 'gdp', 'students');
    });
    
    const activeBtn = document.querySelector(`.nav-btn[onclick="switchLayer('${type}')"]`);
    if(activeBtn) {
        activeBtn.classList.add('active');
        if(themeList.includes(type)) activeBtn.classList.add(type);
    }

    // 更新文本内容
    const config = dataConfig[type] || dataConfig['population'];
    document.getElementById('infoTitle').innerText = config.title;
    document.getElementById('infoDesc').innerText = config.desc;
    document.getElementById('infoTitle').style.borderLeftColor = config.mapColor;
    
    // 更新左侧面板顶部条颜色
    document.querySelector('.left-panel').style.borderTopColor = config.mapColor;

    // 重新渲染图表和地图
    renderMap(type);
    renderCharts(type);
}

// 更新比例尺逻辑
function updateScaleBar() {
    const option = myChart.getOption();
    if (!option.geo) return;

    // 获取当前视图中心点坐标 (经纬度)
    // 由于 ECharts API 限制，我们通过 convertFromPixel 反算
    const width = myChart.getWidth();
    const height = myChart.getHeight();
    const centerPixel = [width / 2, height / 2];
    
    // 取屏幕上 100px 的距离
    const rightPixel = [width / 2 + 100, height / 2];
    
    const centerCoord = myChart.convertFromPixel('geo', centerPixel);
    const rightCoord = myChart.convertFromPixel('geo', rightPixel);
    
    if (centerCoord && rightCoord) {
        // 计算两点间距离 (Haversine formula)
        const R = 6371; // 地球半径 km
        const dLat = (rightCoord[1] - centerCoord[1]) * Math.PI / 180;
        const dLon = (rightCoord[0] - centerCoord[0]) * Math.PI / 180;
        const lat1 = centerCoord[1] * Math.PI / 180;
        const lat2 = rightCoord[1] * Math.PI / 180;

        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        const d = R * c;

        // 寻找最接近的整数刻度 (10, 20, 50, 100, 200, 500, 1000...)
        // 简单的取整逻辑
        let niceDist;
        if (d > 1000) niceDist = Math.round(d / 500) * 500;
        else if (d > 100) niceDist = Math.round(d / 100) * 100;
        else if (d > 10) niceDist = Math.round(d / 10) * 10;
        else niceDist = Math.round(d);
        
        if (niceDist < 1) niceDist = 1;
        
        // 调整比例尺条的宽度以匹配 niceDist
        // 实际距离 d 对应 100px
        // 显示距离 niceDist 对应 x px
        const barWidth = (niceDist / d) * 100;
        
        const scaleLine = document.querySelector('.scale-line');
        const scaleText = document.querySelector('.scale-bar span');
        
        if(scaleLine && scaleText) {
            scaleLine.style.width = barWidth + 'px';
            scaleText.innerText = niceDist + ' km';
        }
    }
}

// 省级比例尺
function updateProvinceScaleBar() {
    if (!provinceMapChart) return;
    const option = provinceMapChart.getOption();
    const series = option.series && option.series[0];
    if (!series) return;

    const width = provinceMapChart.getWidth();
    const height = provinceMapChart.getHeight();
    const centerPixel = [width / 2, height / 2];
    const rightPixel = [width / 2 + 100, height / 2];

    const centerCoord = provinceMapChart.convertFromPixel({seriesIndex: 0}, centerPixel);
    const rightCoord = provinceMapChart.convertFromPixel({seriesIndex: 0}, rightPixel);

    if (centerCoord && rightCoord) {
        const R = 6371;
        const dLat = (rightCoord[1] - centerCoord[1]) * Math.PI / 180;
        const dLon = (rightCoord[0] - centerCoord[0]) * Math.PI / 180;
        const lat1 = centerCoord[1] * Math.PI / 180;
        const lat2 = rightCoord[1] * Math.PI / 180;

        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        const d = R * c;

        let niceDist;
        if (d > 1000) niceDist = Math.round(d / 500) * 500;
        else if (d > 100) niceDist = Math.round(d / 100) * 100;
        else if (d > 10) niceDist = Math.round(d / 10) * 10;
        else niceDist = Math.round(d);
        if (niceDist < 1) niceDist = 1;

        const barWidth = (niceDist / d) * 100;
        
        const scaleLine = document.querySelector('.province-scale-line');
        const scaleText = document.querySelector('.province-scale span');
        
        if(scaleLine && scaleText) {
            scaleLine.style.width = barWidth + 'px';
            scaleText.innerText = niceDist + ' km';
        }
    }
}

// 窗口大小改变时重绘
window.addEventListener('resize', function() {
    myChart.resize();
    pieChart.resize();
    barChart.resize();
    distChart.resize();
    provinceMapChart.resize();
    provinceBarChart.resize();
    updateScaleBar();
    updateProvinceScaleBar();
});

// --- 省级专题深度透视逻辑 ---

let currentProvince = 'Shandong';
let currentTheme = 'population';

const provinceCodes = {
    "Beijing": "110000",
    "Tianjin": "120000",
    "Hebei": "130000",
    "Shanxi": "140000",
    "Inner Mongolia": "150000",
    "Liaoning": "210000",
    "Jilin": "220000",
    "Heilongjiang": "230000",
    "Shanghai": "310000",
    "Jiangsu": "320000",
    "Zhejiang": "330000",
    "Anhui": "340000",
    "Fujian": "350000",
    "Jiangxi": "360000",
    "Shandong": "370000",
    "Henan": "410000",
    "Hubei": "420000",
    "Hunan": "430000",
    "Guangdong": "440000",
    "Guangxi": "450000",
    "Hainan": "460000",
    "Chongqing": "500000",
    "Sichuan": "510000",
    "Guizhou": "520000",
    "Yunnan": "530000",
    "Tibet": "540000",
    "Shaanxi": "610000",
    "Gansu": "620000",
    "Qinghai": "630000",
    "Ningxia": "640000",
    "Xinjiang": "650000"
};

const provinceCN = {
    "Beijing": "北京市", "Tianjin": "天津市", "Hebei": "河北省", "Shanxi": "山西省", "Inner Mongolia": "内蒙古自治区",
    "Liaoning": "辽宁省", "Jilin": "吉林省", "Heilongjiang": "黑龙江省", "Shanghai": "上海市", "Jiangsu": "江苏省",
    "Zhejiang": "浙江省", "Anhui": "安徽省", "Fujian": "福建省", "Jiangxi": "江西省", "Shandong": "山东省",
    "Henan": "河南省", "Hubei": "湖北省", "Hunan": "湖南省", "Guangdong": "广东省", "Guangxi": "广西壮族自治区",
    "Hainan": "海南省", "Chongqing": "重庆市", "Sichuan": "四川省", "Guizhou": "贵州省", "Yunnan": "云南省",
    "Tibet": "西藏自治区", "Shaanxi": "陕西省", "Gansu": "甘肃省", "Qinghai": "青海省", "Ningxia": "宁夏回族自治区",
    "Xinjiang": "新疆维吾尔自治区"
};

function initProvinceSelect() {
    const select = document.getElementById('provinceSelect');
    if (!select) return;
    select.innerHTML = '';
    const keys = Object.keys(cityData || {}).filter(k => provinceCodes[k]);
    keys.sort((a, b) => (provinceCN[a] || a).localeCompare(provinceCN[b] || b, 'zh-Hans'));
    keys.forEach(k => {
        const opt = document.createElement('option');
        opt.value = k;
        opt.text = provinceCN[k] || provinceMap[k] || k;
        if (k === currentProvince) opt.selected = true;
        select.appendChild(opt);
    });
    if (!select.value && keys.length) {
        currentProvince = keys[0];
        select.value = currentProvince;
    }
}

initProvinceSelect();

function switchProvince() {
    currentProvince = document.getElementById('provinceSelect').value;
    renderProvinceSection();
}

function renderProvinceSection() {
    const code = provinceCodes[currentProvince];
    const cnName = provinceCN[currentProvince];
    const config = dataConfig[currentTheme];
    const mapName = `prov_${code}`;
    if (!code) return;
    
    // 确保实例已初始化
    if (!provinceMapChart) {
        const container = document.getElementById('provinceMap');
        if (container) provinceMapChart = echarts.init(container);
    }
    if (!provinceBarChart) {
        const container = document.getElementById('provinceBarChart');
        if (container) provinceBarChart = echarts.init(container);
    }

    // 更新标题
    const titleEl = document.getElementById('provinceMapTitle');
    if (titleEl) titleEl.innerText = `${cnName}${config.title}分布`;

    // 加载省级地图数据
    $.getJSON(`https://geo.datav.aliyun.com/areas_v3/bound/${code}_full.json`, function (geoJson) {
        echarts.registerMap(mapName, geoJson);
        
        const data = (cityData[currentProvince] && cityData[currentProvince][currentTheme]) || [];
        const pieces = buildProvincePieces(data, config);
        
        if (provinceMapChart) {
            provinceMapChart.resize();
            provinceMapChart.setOption({
                tooltip: {
                    trigger: 'item',
                    formatter: '{b}: {c} ' + config.unit
                },
                visualMap: {
                    type: 'piecewise',
                    pieces: pieces,
                    left: 10,
                    bottom: 10,
                    show: true, // 开启图例以便观察
                    seriesIndex: 0
                },
                series: [{
                    type: 'map',
                    map: mapName,
                    data: data,
                    roam: true,
                    label: {
                        show: true,
                        fontSize: 10,
                        color: '#333'
                    },
                    itemStyle: {
                        areaColor: '#f3f3f3',
                        borderColor: '#fff',
                        borderWidth: 1
                    },
                    emphasis: {
                        label: { show: true },
                        itemStyle: { areaColor: '#eee' }
                    }
                }]
            }, true); // 使用 notMerge: true
        }

        if (provinceBarChart) {
            const sorted = [...data].sort((a,b) => a.value - b.value);
            provinceBarChart.setOption({
                color: [config.mapColor],
                tooltip: { trigger: 'axis' },
                grid: { left: '3%', right: '15%', bottom: '3%', containLabel: true },
                xAxis: { type: 'value', name: config.unit },
                yAxis: { 
                    type: 'category', 
                    data: sorted.map(item => item.name) 
                },
                series: [{
                    data: sorted.map(item => item.value),
                    type: 'bar',
                    label: { show: true, position: 'right' }
                }]
            }, true);
        }
        // 省级地图事件与比例尺
        if (provinceMapChart) {
            provinceMapChart.off('georoam');
            provinceMapChart.on('georoam', function () {
                updateProvinceScaleBar();
            });
        }
        setTimeout(updateProvinceScaleBar, 300);
    });
}

// 修改 switchLayer 函数，使其联动省级透视
const originalSwitchLayer = switchLayer;
switchLayer = function(type) {
    originalSwitchLayer(type);
    currentTheme = type;
    renderProvinceSection();
};

// 初始化省级透视
setTimeout(renderProvinceSection, 1000);

// --- 新增交互功能 ---

// 1. 地图控制功能
function zoomMap(ratio) {
    const option = myChart.getOption();
    const geo = option.geo[0];
    
    // 获取当前缩放级别
    let newZoom = (geo.zoom || 1.2) * ratio;
    
    // 限制缩放范围
    newZoom = Math.max(0.5, Math.min(newZoom, 10));
    
    myChart.setOption({
        geo: {
            zoom: newZoom
        }
    });
    
    // 更新比例尺
    setTimeout(updateScaleBar, 100);
}

function resetMap() {
    // 使用 restore 动作重置地图状态
    myChart.dispatchAction({
        type: 'restore'
    });
    
    // 重置 zoom 属性
    myChart.setOption({
        geo: {
            zoom: 1.2,
            center: null
        }
    });
    
    setTimeout(updateScaleBar, 100);
}

// 2. 省份详情卡片逻辑

// 反向查找省份英文名 (用于查询 rawData)
function getProvinceKey(cnName) {
    return Object.keys(provinceMap).find(key => provinceMap[key] === cnName);
}

function showProvinceCard(cnName) {
    const engName = getProvinceKey(cnName);
    if (!engName) return;

    // 更新标题
    document.getElementById('cardTitle').innerText = cnName;

    // 更新数据列表
    const listContainer = document.getElementById('cardDataList');
    listContainer.innerHTML = '';

    // 定义要展示的指标
    const metrics = [
        { key: 'population', label: '人口总量', unit: '万人', color: '#1abc9c', max: 14000 },
        { key: 'gdp', label: '地区生产总值', unit: '亿元', color: '#e67e22', max: 150000 },
        { key: 'students', label: '在校生人数', unit: '万人', color: '#9b59b6', max: 1200 }
    ];

    metrics.forEach(m => {
        const val = rawData[m.key] ? rawData[m.key][engName] : undefined;
        const hasData = val !== undefined;
        const valueStr = hasData ? val + ' ' + m.unit : '暂无数据';
        const percentage = hasData ? Math.min((val / m.max) * 100, 100) : 0;
        
        const item = document.createElement('div');
        item.className = 'data-item';
        item.innerHTML = `
            <div class="data-label">
                <span>${m.label}</span>
                <span class="data-value">${valueStr}</span>
            </div>
            <div class="progress-container">
                <div class="progress-bar" style="width: ${percentage}%; background: ${m.color}"></div>
            </div>
        `;
        listContainer.appendChild(item);
    });

    // 显示卡片
    document.querySelector('.province-card').classList.add('active');
}

function closeCard() {
    document.querySelector('.province-card').classList.remove('active');
}

// 3. 绑定地图点击事件
myChart.on('click', function (params) {
    if (params.componentType === 'series') {
        const provinceName = params.name;
        if (provinceName) {
            showProvinceCard(provinceName);
        }
    }
});

// 点击地图空白处关闭卡片
myChart.getZr().on('click', function (params) {
    if (!params.target) {
        closeCard();
    }
});
