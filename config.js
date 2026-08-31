export const siteConfigInput = {
  site: {
    title: 'Neos',
    description: '一个极简、快速的 Markdown 博客。',
    language: 'zh-CN',
    establishedAt: '2020-11-29T00:00:00+08:00',
  },
  owner: {
    name: 'Neoss',
    avatar: '/logo.webp',
  },
  navbar: {
    brand: {
      kind: 'text',
      text: 'Neos'
    },
    name: '',
    links: [
      { label: '首页', href: '/' },
      { label: '文章', href: '/pages/neos/' },
    ],
  },
  pagination: {
    articlesPerPage: 10,
    position: 'DOWN',
  },
  siteInfoCard: {
    ariaLabel: '站点信息',
    avatarAltSuffix: '的头像',
    label: 'MAN',
    articleCountLabel: '文章数目',
    articleCountUnit: '篇',
    runtimeLabel: '运行时间',
    runtimeLessThanOneDayLabel: '不到一天',
    runtimeUnit: '天',
    wordCountLabel: '总字数',
    wordCountUnit: '字',
  },
  aboutMe: {
    bio: '这个博客用来存放学习笔记、折腾经验与生活记录。',
    // 可用图标：github / email / rss / telegram / bilibili / x
    links: [
      { label: 'GitHub', href: 'https://github.com/', icon: 'github' },
      { label: 'email', href: 'mailto:you@outlook.com', icon: 'email' },
    ],
  },
  milestones: [
    {
      date: '2020-10',
      title: '盘古开天地',
      description: '博客正式建立，开始记录学习与生活。',
    },
  ],
};
