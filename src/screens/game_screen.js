let { GWE } = require('gwe');
let { UIAvatar } = require('../ui/ui_avatar');
let { UIBackground } = require('../ui/ui_background');

class GameScreen extends GWE.Screen {
  constructor(app) {
    super(app);
    this.player = this.app.getPlayer();
    this.scriptMachine = new GWE.ScriptMachine();

    this.scriptMachine.registerCommand('WAITPAD', GWE.Utils.BIND(this.$waitPad, this));
    this.scriptMachine.registerCommand('GOTO', GWE.Utils.BIND(this.$goto, this));
    this.scriptMachine.registerCommand('GOTO_IF', GWE.Utils.BIND(this.$gotoIf, this));
    this.scriptMachine.registerCommand('EXEC_IF', GWE.Utils.BIND(this.$execIf, this));
    this.scriptMachine.registerCommand('VAR_SET', GWE.Utils.BIND(this.$varSet, this));
    this.scriptMachine.registerCommand('VAR_ADD', GWE.Utils.BIND(this.$varAdd, this));
    this.scriptMachine.registerCommand('VAR_SUB', GWE.Utils.BIND(this.$varSub, this));
    this.scriptMachine.registerCommand('DELAY', GWE.Utils.BIND(this.$delay, this));
    this.scriptMachine.registerCommand('UI_CREATE_DIALOG', GWE.Utils.BIND(this.$uiCreateDialog, this));
    this.scriptMachine.registerCommand('UI_CREATE_CHOICES', GWE.Utils.BIND(this.$uiCreateChoices, this));
    this.scriptMachine.registerCommand('UI_CREATE_MESSAGE', GWE.Utils.BIND(this.$uiCreateMessage, this));
    this.scriptMachine.registerCommand('UI_CREATE_PRINT', GWE.Utils.BIND(this.$uiCreatePrint, this));
    this.scriptMachine.registerCommand('UI_CREATE_AVATAR', GWE.Utils.BIND(this.$uiCreateAvatar, this));
    this.scriptMachine.registerCommand('UI_CREATE_BACKGROUND', GWE.Utils.BIND(this.$uiCreateBackground, this));
    this.scriptMachine.registerCommand('UI_PLAY_AVATAR', GWE.Utils.BIND(this.$uiPlayAvatar, this));
    this.scriptMachine.registerCommand('UI_PLAY_BACKGROUND', GWE.Utils.BIND(this.$uiPlayBackground, this));
    this.scriptMachine.registerCommand('UI_ANIMATE_AVATAR', GWE.Utils.BIND(this.$uiAnimateAvatar, this));
    this.scriptMachine.registerCommand('UI_ANIMATE_BACKGROUND', GWE.Utils.BIND(this.$uiAnimateBackground, this));
    this.scriptMachine.registerCommand('UI_DESTROY_AVATAR', GWE.Utils.BIND(this.$uiDestroyAvatar, this));
    this.scriptMachine.registerCommand('UI_DESTROY_BACKGROUND', GWE.Utils.BIND(this.$uiDestroyBackground, this));
    this.scriptMachine.registerCommand('UI_FADE_IN', GWE.Utils.BIND(this.$uiFadeIn, this));
    this.scriptMachine.registerCommand('UI_FADE_OUT', GWE.Utils.BIND(this.$uiFadeOut, this));
  }

  update(ts) {
    this.scriptMachine.update(ts);
  }

  onEnter() {
    this.loadScript('./assets/rooms/sample00/script.jsc');
  }

  async loadScript(path) {
    this.scriptMachine.loadFromFile(path);
    this.scriptMachine.jump('ON_INIT');
    this.scriptMachine.setEnabled(true);
  }

  $waitPad() {
    this.scriptMachine.setEnabled(false);
    GWE.eventManager.subscribe(GWE.inputManager, 'E_KEYDOWN_ONCE', this, (data) => {
      if (data.key == GWE.InputKeyEnum.ENTER) {
        GWE.eventManager.unsubscribe(GWE.inputManager, 'E_KEYDOWN_ONCE', this);
        this.scriptMachine.setEnabled(true);
      } 
    });
  }

  $goto(jumpto) {
    return jumpto;
  }

  $gotoIf(varloc, cond, value, jumpto) {
    if (CHECK_CONDITION(this.player.getVariant(varloc), cond, value)) {
      return jumpto;
    }
  }

  $execIf(varloc, cond, value, cmd = { CommandName, CommandArgs }) {
    if (CHECK_CONDITION(this.player.getVariant(varloc), cond, value)) {
      this.scriptMachine.runCommand(cmd['CommandName'], cmd['CommandArgs']);
    }
  }

  $varSet(varloc, value) {
    this.player.setVariant(varloc, value);
  }

  $varAdd(varloc, value) {
    let variant = this.player.getVariant(varloc);
    this.player.setVariant(varloc, variant + value);
  }

  $varSub(varloc, value) {
    let variant = this.player.getVariant(varloc);
    this.player.setVariant(varloc, variant - value);
  }

  $delay(ms) {
    this.scriptMachine.setEnabled(false);
    window.setTimeout(() => this.scriptMachine.setEnabled(true), ms);
  }

  async $uiCreateDialog(author, text) {
    this.scriptMachine.setEnabled(false);
    let uiDialog = new GWE.UIDialog();
    uiDialog.setAuthor(author);
    uiDialog.setText(text);
    GWE.uiManager.addWidget(uiDialog);
    GWE.uiManager.focus(uiDialog);
    await GWE.eventManager.wait(uiDialog, 'E_CLOSE');
    GWE.uiManager.removeWidget(uiDialog);
    this.scriptMachine.setEnabled(true);
  }

  async $uiCreateChoices(author, text, choices = []) {
    this.scriptMachine.setEnabled(false);
    let uiDialog = new GWE.UIDialog();
    uiDialog.setAuthor(author);
    uiDialog.setText(text);
    GWE.uiManager.addWidget(uiDialog);
    await GWE.eventManager.wait(uiDialog, 'E_PRINT_FINISHED');

    let uiMenu = new GWE.UIMenu();
    GWE.uiManager.addWidget(uiMenu, 'position:absolute; top:50%; left:50%; transform:translate(-50%,-50%)');
    for (let choice of choices) {
      uiMenu.addWidget(new GWE.UIMenuText({ text: choice['Text'] }));
    }

    GWE.uiManager.focus(uiMenu);
    let data = await GWE.eventManager.wait(uiMenu, 'E_MENU_ITEM_SELECTED');
    GWE.uiManager.removeWidget(uiDialog);
    GWE.uiManager.removeWidget(uiMenu);
    this.scriptMachine.jump(choices[data.index]['Jumpto']);
    this.scriptMachine.setEnabled(true);
  }

  async $uiCreateMessage(picture, author, text) {
    this.scriptMachine.setEnabled(false);
    let uiMessage = new GWE.UIMessage();
    uiMessage.setPicture(picture);
    uiMessage.setAuthor(author);
    uiMessage.setText(text);
    GWE.uiManager.addWidget(uiMessage);
    GWE.uiManager.focus(uiMessage);
    await GWE.eventManager.wait(uiMessage, 'E_CLOSE');
    GWE.uiManager.removeWidget(uiMessage);
    this.scriptMachine.setEnabled(true);
  }

  async $uiCreatePrint(text) {
    this.scriptMachine.setEnabled(false);
    let uiPrint = new GWE.UIPrint();
    uiPrint.setText(text);
    GWE.uiManager.addWidget(uiPrint);
    GWE.uiManager.focus(uiPrint);
    await GWE.eventManager.wait(uiPrint, 'E_CLOSE');
    GWE.uiManager.removeWidget(uiPrint);
    this.scriptMachine.setEnabled(true);
  }

  $uiCreateAvatar(spriteFile, animation, isLooped, location) {
    let uiAvatar = new UIAvatar();
    uiAvatar.changeLocation(location);
    uiAvatar.loadFromFile(spriteFile);
    uiAvatar.play(animation, isLooped);
    GWE.uiManager.addWidget(uiAvatar);
  }

  $uiCreateBackground(spriteFile, animation, isLooped) {
    let uiBackground = new UIBackground();
    uiBackground.loadFromFile(spriteFile);
    uiBackground.play(animation, isLooped);
    GWE.uiManager.addWidget(uiBackground);
  }

  $uiPlayAvatar(avatarIndex, animation, isLooped) {
    let widgets = GWE.uiManager.getWidgets();
    let uiAvatars = widgets.filter(w => w instanceof UIAvatar);
    uiAvatars[avatarIndex].play(animation, isLooped);
  }

  $uiPlayBackground(backgroundIndex, animation, isLooped) {
    let widgets = GWE.uiManager.getWidgets();
    let uiBackgrounds = widgets.filter(w => w instanceof UIBackground);
    uiBackgrounds[backgroundIndex].play(animation, isLooped);
  }

  $uiAnimateAvatar(avatarIndex, animate) {
    let widgets = GWE.uiManager.getWidgets();
    let uiAvatars = widgets.filter(w => w instanceof UIAvatar);
    uiAvatars[avatarIndex].animate(animate);
  }

  $uiAnimateBackground(backgroundIndex, animate) {
    let widgets = GWE.uiManager.getWidgets();
    let uiBackgrounds = widgets.filter(w => w instanceof UIBackground);
    uiBackgrounds[backgroundIndex].animate(animate);
  }

  $uiDestroyAvatar(avatarIndex) {
    let widgets = GWE.uiManager.getWidgets();
    let uiAvatars = widgets.filter(w => w instanceof UIAvatar);
    GWE.uiManager.removeWidget(uiAvatars[avatarIndex]);
  }

  $uiDestroyBackground(backgroundIndex) {
    let widgets = GWE.uiManager.getWidgets();
    let uiBackgrounds = widgets.filter(w => w instanceof UIBackground);
    GWE.uiManager.removeWidget(uiBackgrounds[backgroundIndex]);
  }

  $uiFadeIn(delay, ms, timingFunction) {
    this.scriptMachine.setEnabled(false);
    GWE.uiManager.fadeIn(delay, ms, timingFunction, () => this.scriptMachine.setEnabled(true));
  }

  $uiFadeOut(delay, ms, timingFunction) {
    this.scriptMachine.setEnabled(false);
    GWE.uiManager.fadeOut(delay, ms, timingFunction, () => this.scriptMachine.setEnabled(true));
  }
}

module.exports.GameScreen = GameScreen;