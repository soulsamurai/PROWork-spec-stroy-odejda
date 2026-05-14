/**
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} sku
 * @property {string} title
 * @property {"workwear"|"footwear"|"ppe"|"accessories"} categoryId
 * @property {number} price
 * @property {number=} oldPrice
 * @property {number} popularity
 * @property {number} rating
 * @property {number} reviewCount
 * @property {string[]} sizes
 * @property {string[]} badges
 * @property {string[]} images — полный URL (https://…), путь (./media/… или /…), либо короткое имя *.jpg при PRODUCT_MEDIA_BASE в image-url.js
 * @property {string} shortDescription
 * @property {string} description
 * @property {string[]} features
 * @property {Record<string,string>} specs
 * @property {string[]} care
 */

export {};

