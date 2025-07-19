const configs = {
  // indiaToday: {
  //   url: 'https://www.indiatoday.in/',
  //   selectors: {
  //     waitForSelectors: ['.B1S3_content__wrap__9mSB6', '.B1S3_story__shortcont__inicf', '.thumb.playIconThumbContainer', '.story__interaction'],
  //     headlineSelector: '.B1S3_content__wrap__9mSB6 h2',
  //     contentSelector: '.B1S3_story__shortcont__inicf',
  //     imageSelector: '.thumb.playIconThumbContainer',
  //     articleLinkSelector: '.B1S3_content__wrap__9mSB6 a',
  //     commentCountSelector: '.SocialShare_story__interaction__feJdj .comment .commentCountEle', // Full path to element
  //   },
  //   articleSelectors: {
  //     fullContentSelector: '.Story_story__content__body__qCd5E story__content__body', // Example selector for full content
  //     h1Selector: 'h1', // Selector for h1
  //     h2Selector: 'h2', // Selector for h2
  //     pSelector: 'p', // Selector for p
  //     dateSelector: '.Story_stryupdates__wdMz_', // Selector for date
  //     imageSelector: 'img', // Selector for image
  //     likesSelector: 'likes', // Selector for likes

  //   },
  // },

  hindustanTimes: {
    url: 'https://www.hindustantimes.com/',
    selectors: {
      waitForSelectors: ['.hdg3', '.sortDec', 'figure'],
      headlineSelector: '.hdg3 a',
      contentSelector: '.sortDec',
      imageSelector: 'figure',
      articleLinkSelector: '.hdg3 a',
    },
    articleSelectors: {
      fullContentSelector: '.story__detail',
      h1Selector: 'h1',
      h2Selector: 'h2',
      pSelector: '.story__detail p',
      dateSelector: '.dateTime',
      imageSelector: 'img',
      likesSelector: '.likes',
      commentsSelector: '.comments',
    },
  },
};

export default configs;


// const configs = {
//   hindustanTimes: {
//     url: 'https://www.hindustantimes.com/',
//     selectors: {
//       waitForSelectors: ['.storyCard .cardHeading a', '.storyCard .cardDescription', '.storyCard img'],
//       headlineSelector: '.storyCard .cardHeading a',
//       contentSelector: '.storyCard .cardDescription',
//       imageSelector: '.storyCard img',
//       articleLinkSelector: '.storyCard .cardHeading a'
//     },
//     articleSelectors: {
//       fullContentSelector: '.story__detail',
//       h1Selector: 'h1',
//       h2Selector: 'h2',
//       pSelector: '.story__detail p',
//       dateSelector: '.dateTime',
//       imageSelector: 'img',
//       likesSelector: '.likes',
//       commentsSelector: '.comments'
//     }
//   }
// };

// export default configs;

