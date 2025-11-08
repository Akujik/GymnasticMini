/**
 * Notes: 通用类库
 * Ver : CCMiniCloud Framework 2.9.1 ALL RIGHTS RESERVED BY nzc816 (wechat)
 * Date: 2020-11-14 07:48:00
 */

/**
 * 判断变量，参数，对象属性是否定义
 * @param {*} val
 */
function isDefined(val) {
  // ==  不能判断是否为null
  if (val === undefined) return false;
  else return true;
}

/**
 * 判断对象是否为空
 * @param {*} obj
 */
function isObjectNull(obj) {
  return Object.keys(obj).length == 0;
}

function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

function formatNumber(n) {
  n = n.toString();
  return n[1] ? n : "0" + n;
}

/**
  * 从picker options中 获取索引值
  * @param {*} options 
  * [{
 		value: 0,
 		label: '猎头'
 	}]
  * @param {*} val 
  */
function getOptionsIdx(options, val) {
  for (let i = 0; i < options.length; i++) {
    if (options[i].value === val) return i;
  }
  return 0;
}

// 哈弗辛公式(Haversine formula)来计算两个地理坐标点之间的距离
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (degree) => {
    return (degree * Math.PI) / 180;
  };
  var R = 6371; // 地球半径，单位：千米
  var dLat = toRad(lat2 - lat1);
  var dLon = toRad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d; // 返回的是千米
};
const getDistance = (geo, globalData, hasUnit = true) => {
  // console.info(geo, globalData);
  const { latitude, longitude } = globalData;
  var result = haversineDistance(
    latitude,
    longitude,
    geo.latitude,
    geo.longitude
  );
  if (result < 1) {
    return parseInt(result * 1000) + (hasUnit ? "米" : "");
  } else {
    return parseInt(result * 100) / 100 + (hasUnit ? "公里" : "");
  }
};

module.exports = {
  isDefined,
  isObjectNull,
  sleep,
  getDistance,
  getOptionsIdx,
};
