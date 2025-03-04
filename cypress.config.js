const { defineConfig } = require('cypress');

module.exports = defineConfig({
  projectId: 'lolvet',
  video: false,
  e2e: {
    baseUrl: 'https://uat-lovlet-main-services.lookinid.com/v1',
    specPattern: [
      'cypress/e2e/auth/sendOTP.cy.js',
      'cypress/e2e/auth/verifyOTP.cy.js',
      'cypress/e2e/auth/ageAndzodiac.cy.js',
      'cypress/e2e/auth/refreshToken.cy.js',
      'cypress/e2e/auth/signUpKBY.cy.js',
    ],
    screenshotOnRunFailure: true,
    experimentalSessionAndOrigin: true,
    chromeWebSecurity: false,
    setupNodeEvents(on, config) {
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
      });
    },
  },
});
