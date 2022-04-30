let { GWE } = require('gwe');

class UIBackground extends GWE.UISprite {
  constructor() {
    super({
      className: 'UIBackground'
    });
  }
}

module.exports.UIBackground = UIBackground;