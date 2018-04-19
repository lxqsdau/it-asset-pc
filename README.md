 
"indent":[1,2],

数组第一个指定是否启用这个规则

"off" 或 0 - 关闭规则
"warn" 或 1 - 开启规则，使用警告级别的错误：warn (不会导致程序退出)
"error" 或 2 - 开启规则，使用错误级别的错误：error (当被触发的时候，程序会退出)

数组第二个指定空几个空格
    

    
`"eslint": "3.19.0",
"eslint-config-airbnb": "15.1.0"
"eslint-plugin-import": "2.7.0",
"eslint-plugin-jsx-a11y": "5.1.1",
"eslint-plugin-react": "7.1.0" `

配置文件是在.eslintrc文件中，也有可能是.eslintrc.js或者.eslintrc.json。
代码中遇到一些实在无法lint的可以注释的方式临时关闭eslint检查
/* eslint-disable */

alert('foo');

/* eslint-enable */
有一些文件你不想它被lint，可以写在.eslintignore文件中
assembly/
coverage/
dist/
fntest/
mocks/
mocks_data/
node_modules/
run/
spm_modules/

https://segmentfault.com/a/1190000006194584






2
线上
领用地点维护 
 https://g.alicdn.com/platform/it-asset-pc/1.0.3/useAddress.css
 https://g.alicdn.com/platform/it-asset-pc/1.0.3/useAddress.js

领用自用      
 https://g.alicdn.com/platform/it-asset-pc/1.0.3/selfUse.css
 https://g.alicdn.com/platform/it-asset-pc/1.0.3/selfUse.js

审批查看页面
https://g.alicdn.com/platform/it-asset-pc/1.0.3/viewTask.css
https://g.alicdn.com/platform/it-asset-pc/1.0.3/viewTask.js

领用公用
 https://g.alicdn.com/platform/it-asset-pc/1.0.3/publicUse.css
 https://g.alicdn.com/platform/it-asset-pc/1.0.3/publicUse.js

自助柜补货
 https://g.alicdn.com/platform/it-asset-pc/1.0.3/selfAddGoods.css
 https://g.alicdn.com/platform/it-asset-pc/1.0.3/selfAddGoods.js

线上
 更换第一步
 https://g.alicdn.com/platform/it-asset-pc/1.0.9/changeSelectAsset.css
https://g.alicdn.com/platform/it-asset-pc/1.0.9/changeSelectAsset.js
更换第二步
 https://g.alicdn.com/platform/it-asset-pc/1.0.9/changeSelectBill.css
 https://g.alicdn.com/platform/it-asset-pc/1.0.9/changeSelectBill.js

日常：
更换第一步
http://g-alicdn.daily.taobao.net/platform/it-asset-pc/1.0.9/changeSelectAsset.css
http://g-alicdn.daily.taobao.net/platform/it-asset-pc/1.0.9/changeSelectAsset.js
更换第二步
http://g-alicdn.daily.taobao.net/platform/it-asset-pc/1.0.9/changeSelectBill.js
http://g-alicdn.daily.taobao.net/platform/it-asset-pc/1.0.9/changeSelectBill.css



借用 日常
http://g-alicdn.daily.taobao.net/platform/it-asset-pc/1.1.3/borrow.css
http://g-alicdn.daily.taobao.net/platform/it-asset-pc/1.1.3/borrow.js


更换审批查看页面 日常
http://g-alicdn.daily.taobao.net/platform/it-asset-pc/1.1.0/changeViewTask.css
http://g-alicdn.daily.taobao.net/platform/it-asset-pc/1.1.0/changeViewTask.css
 


已解决：
加上translate，图片没了


待解决：
borrow.js <XujieSelect ref={(c) => { c && this.xujieUi.push(c); }}    一次render c 可能为null


待发布
借用审批
更换审批
更换提交
公用
自用

