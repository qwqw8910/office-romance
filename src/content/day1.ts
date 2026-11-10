import type {
  BossEvent,
  Choice,
  ChoiceOption,
  LeadId,
  Line,
  Script,
  SpeakerId,
} from '../game/types'

const l = (speaker: SpeakerId, text: string, mood?: string): Line => ({
  kind: 'line',
  speaker,
  text,
  mood,
})
const choice = (...options: ChoiceOption[]): Choice => ({ kind: 'choice', options })

const jia = (text: string, mood?: string) => l('jia', text, mood)
const inner = (text: string) => l('inner', text)
const zhou = (text: string, mood?: string) => l('zhou', text, mood)
const shen = (text: string, mood?: string) => l('shen', text, mood)
const nar = (text: string) => l('narrator', text)

const boss = (event: Omit<BossEvent, 'kind'>): BossEvent => ({ kind: 'boss', ...event })

/** 17:30 最終關：突襲找茶葉蛋，離開後回馬槍 */
const finalBoss = (lead: LeadId): BossEvent =>
  boss({
    pattern: 'combo',
    cover: 'pen',
    lead,
    hint: '最後一關：他會先衝進來，再假裝離開。會議桌下適合蹲下撿筆。',
    success: [
      jia('找到了！我的茶葉蛋！', '抱著蛋離開'),
      nar('會議桌底下，兩個人憋著笑，誰也沒先站起來。'),
    ],
    awkward: [
      jia('晏晴你在會議室講電話？要不要順便幫我訂明天的便當？', '探頭'),
      inner('氣氛，完全沒了。'),
    ],
    caught: [
      jia('會議室下班後是加班專用的喔。', '眯眼'),
      jia('你們是不是想加班？很好很好，我們是一家人嘛。'),
    ],
  })

export const day1: Script = {
  opening: [
    nar('08:58，林晏晴刷卡進門，比規定早了兩分鐘。'),
    nar('螢幕上貼著一張便利貼，字寫得很圓。'),
    jia('「晏晴～這個很簡單吧？下班前給我 :)」', '便利貼'),
    inner('這是本週第四個「很簡單」。今天才星期二。'),
    inner('還好，這間公司除了經理，還有一些值得來上班的理由。'),
  ],
  slots: [
    {
      id: 'desk',
      time: '09:00',
      title: '晨會後的座位區',
      location: 'desk',
      beats: [
        zhou('晏晴姐！我的電腦好像壞了，你可以幫我看一下嗎？', '抱著筆電'),
        inner('他的螢幕亮著，游標在動，音樂還在播。'),
        choice(
          {
            text: '「你是不是根本沒壞？」',
            effects: [{ lead: 'zhou', delta: 10 }],
            then: [zhou('……被發現了。', '臉紅'), zhou('我只是想問你，午休要不要一起去買飲料。')],
          },
          {
            text: '「我很忙，你找別人。」',
            effects: [{ lead: 'zhou', delta: -5 }],
            then: [zhou('喔……好，那我晚點再來。', '垂頭')],
          },
          {
            text: '默默幫他把音樂關掉。',
            effects: [{ lead: 'zhou', delta: 5 }],
            then: [zhou('欸？原來是這個在吵！晏晴姐好厲害。', '眼睛發亮')],
          },
        ),
        zhou('那個，晏晴姐，其實我——'),
        boss({
          pattern: 'patrol',
          cover: 'phone',
          lead: 'zhou',
          hint: '看地上的路線。他會一直往前走，在他看到你之前按空白鍵掩護。座位區桌上有電話。',
          success: [
            jia('嗯嗯，大家都很認真，我們是一家人嘛。', '路過'),
            zhou('（小聲）晏晴姐講電話的樣子好專業……', '偷笑'),
          ],
          awkward: [
            jia('晏晴，座位區哪來的影印機？你在印空氣喔？', '停下'),
            inner('……他居然站在這裡講了三分鐘的冷笑話。'),
            zhou('（剛剛想說的話，好像說不出口了。）', '尷尬'),
          ],
          caught: [
            jia('欸～年輕人很有活力嘛！一大早就在聊天。', '探頭'),
            jia('那這份週報，你們兩個一起做。這個很簡單吧？'),
            inner('好的，又多一份。'),
          ],
        }),
      ],
    },
    {
      id: 'pantry',
      time: '10:30',
      title: '茶水間',
      location: 'pantry',
      beats: [
        nar('茶水間。咖啡機正在發出它最努力的聲音。'),
        shen('你的太淡。', '面無表情'),
        nar('沈硯把她的馬克杯換成另一杯，那杯已經泡好了。'),
        choice(
          {
            text: '「你怎麼知道我喝什麼？」',
            effects: [{ lead: 'shen', delta: 10 }],
            then: [shen('你每天都喝一樣的。', '別過頭'), inner('……他每天都在看？')],
          },
          {
            text: '「謝謝，但我自己來就好。」',
            effects: [{ lead: 'shen', delta: -5 }],
            then: [shen('嗯。', '收回手')],
          },
          {
            text: '回敬他一包餅乾。',
            effects: [{ lead: 'shen', delta: 5 }],
            then: [shen('……我不吃甜的。', '收進口袋')],
          },
        ),
        boss({
          pattern: 'ambush',
          cover: 'phone',
          lead: 'shen',
          hint: '聞到茶葉蛋味就是他要衝進來了，立刻掩護。茶水間適合假裝講電話。',
          success: [
            nar('沈硯不動聲色地往前站了一步，正好擋在她前面。'),
            jia('沈律師也在啊，辛苦辛苦。', '剝蛋殼'),
            shen('走了。', '低聲'),
          ],
          awkward: [
            jia('晏晴你蹲在那邊幹嘛？筆掉了？茶水間的地很髒喔。', '低頭看'),
            shen('……', '嘆氣'),
          ],
          caught: [
            jia('你們在討論法務的事嗎？太好了。', '剝蛋殼'),
            jia('沈律師順便幫我看一下我家房東的合約，我們是一家人嘛。'),
            shen('……', '額頭青筋'),
          ],
        }),
      ],
    },
    {
      id: 'rooftop',
      time: '12:30',
      title: '午休頂樓',
      location: 'rooftop',
      beats: [
        nar('頂樓。今天風不大，便當還是熱的。'),
        inner('上午加起來被叫了五次，終於有十分鐘是自己的。'),
        inner('要找誰一起吃呢？'),
        choice(
          {
            text: '傳訊息給周以澄',
            effects: [{ lead: 'zhou', delta: 10 }],
            flag: ['lunch', 'zhou'],
            then: [
              zhou('晏晴姐！我剛好多買了一杯！', '喘氣跑上來'),
              inner('兩杯一模一樣的珍奶，半糖少冰，是我的甜度。'),
            ],
          },
          {
            text: '走去找在長椅上看書的沈硯',
            effects: [{ lead: 'shen', delta: 10 }],
            flag: ['lunch', 'shen'],
            then: [shen('坐。', '脫下外套墊在椅子上'), inner('他翻書的速度，在我坐下之後變慢了。')],
          },
        ),
        choice(
          { text: '「謝謝你。」', then: [inner('今天第一次，不是因為工作說謝謝。')] },
          {
            text: '「明天也一起？」',
            then: [inner('說出口才發現，自己有點期待明天。')],
          },
        ),
      ],
    },
    {
      id: 'copyroom',
      time: '15:00',
      title: '影印室',
      location: 'copyroom',
      beats: [
        zhou('晏晴姐，我幫你印！五十份對吧！', '自信'),
        nar('影印機發出一聲很長的嗶——然後卡紙了。'),
        nar('兩人一起蹲下拉紙，肩膀碰在一起。'),
        choice(
          {
            text: '「你手好冰。」',
            effects: [{ lead: 'zhou', delta: 15 }],
            then: [zhou('那、那你幫我暖一下……我是說，紙！紙卡住了！', '爆紅')],
          },
          {
            text: '「讓開，我來。」',
            then: [zhou('是！', '立正'), inner('三秒修好。他看我的眼神像在看魔術。')],
          },
          {
            text: '拍拍他的頭：「下次叫我就好。」',
            effects: [{ lead: 'zhou', delta: 10 }],
            then: [zhou('……嗯。', '不敢動')],
          },
        ),
        boss({
          pattern: 'fakeout',
          cover: 'copy',
          lead: 'zhou',
          hint: '他可能會假裝離開。掩護只有 2 秒，太早按會在他回頭時剛好結束。',
          success: [
            jia('嗯，影印機很忙，公司很需要這種精神。', '滿意離開'),
            zhou('（憋笑憋到發抖）', '對看一眼'),
          ],
          awkward: [
            jia('晏晴，你對著影印機講電話？打給誰？維修廠商？', '狐疑'),
            inner('……他站在門口等我掛電話，整整一分鐘。'),
          ],
          caught: [
            jia('影印機壞了你們兩個在修喔？好啦，人才。', '拍手'),
            jia('那以後全公司的影印機就歸你們管了。這個很簡單吧？'),
          ],
        }),
      ],
    },
    {
      id: 'meeting',
      time: '17:30',
      title: '下班前的會議室',
      location: 'meeting',
      beats: {
        byLead: {
          zhou: [
            nar('會議室的燈只開了一半。周以澄已經在裡面了。'),
            nar('白板上寫滿了字，被他用身體擋住一半。'),
            zhou('晏晴姐，我、我想請你吃晚餐。我練習了很多次，所以應該不會講錯。', '緊張'),
            inner('白板上第一行寫著：「先自然地打招呼」。'),
            choice(
              {
                text: '「好啊，你請。」',
                effects: [{ lead: 'zhou', delta: 10 }],
                then: [zhou('真的嗎！太好了！', '握拳')],
              },
              {
                text: '「白板上第三行寫什麼？」',
                effects: [{ lead: 'zhou', delta: 5 }],
                then: [zhou('不、不可以看！', '撲過去擦')],
              },
            ),
            finalBoss('zhou'),
          ],
          shen: [
            nar('會議室的燈只開了一半。沈硯坐在角落，筆電開著。'),
            shen('經理早上丟給你的那份，我整理了一半。', '把螢幕轉過來'),
            shen('剩下的，明天一起做。'),
            inner('……他怎麼知道那份東西的存在？'),
            choice(
              {
                text: '「為什麼幫我？」',
                effects: [{ lead: 'shen', delta: 10 }],
                then: [shen('你每天都最晚走。', '看著她'), shen('我不喜歡。')],
              },
              {
                text: '「法務也會做簡報？」',
                effects: [{ lead: 'shen', delta: 5 }],
                then: [shen('會一點。', '嘴角動了一下')],
              },
            ),
            finalBoss('shen'),
          ],
        },
      },
    },
  ],
  endings: {
    safe: {
      zhou: [
        nar('18:00。電梯門正要關上。'),
        nar('一隻手伸進來按住了開門鍵。'),
        zhou('晏晴姐，明天也要一起加油！', '笑'),
        inner('明天，好像也沒那麼糟。'),
      ],
      shen: [
        nar('18:00。電梯口。'),
        nar('沈硯什麼也沒說，只把她忘在椅背上的圍巾遞過來。'),
        shen('冷。'),
        inner('明天，好像也沒那麼糟。'),
      ],
    },
    caught: [
      nar('17:59，經理辦公室。'),
      jia('晏晴，坐。我都看到了。', '嚴肅'),
      inner('完了。'),
      jia('你在搞副業，對吧？', '推眼鏡'),
      jia('年輕人有熱情很好。那個副業的企劃也寫一份給我。'),
      jia('這個很簡單吧？下班前給我。'),
    ],
  },
}

/** 說話者顯示名稱 */
export const SPEAKER_NAMES: Record<SpeakerId, string> = {
  lin: '林晏晴',
  inner: '林晏晴（內心）',
  zhou: '周以澄',
  shen: '沈硯',
  jia: '賈正經 經理',
  narrator: '',
}

export const COVER_NAMES = {
  phone: '講電話',
  copy: '假裝影印',
  pen: '蹲下撿筆',
} as const
