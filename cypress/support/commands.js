import easyYopmail from 'easy-yopmail';
import 'cypress-iframe';
import 'cypress-file-upload';

function generateRandomEmail() {
  const randomString = Math.random().toString(36).substring(2, 10);
  return `${randomString}@yopmail.com`;
}

Cypress.Commands.add('generateRandomEmail', () => {
  return cy.wrap(generateRandomEmail());
});

Cypress.Commands.add('generateRandomFCMToken', (length = 32) => {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return cy.wrap(result);
});

Cypress.Commands.add('getLatestOTPFromYopmail', (email) => {
  cy.visit('https://yopmail.com/en/');

  cy.get('#login').clear().type(email).type('{enter}');

  cy.get('iframe#ifinbox').then(($iframe) => {
    const iframeBody = $iframe.contents().find('body');

    cy.wrap(iframeBody).find('button').first().click();
  });

  cy.get('#refresh').click();

  cy.frameLoaded('#ifmail');

  cy.iframe('#ifmail')
    .find("div[style*='color: rgba(182, 96, 205, 1)']")
    .invoke('text')
    .then((otp) => {
      if (otp) {
        cy.wrap(otp.trim()).as('otpCode');
      } else {
        throw new Error('OTP Not Found in Latest Email!');
      }
    });
});

Cypress.Commands.add('sendOTP', (body) => {
  cy.request({
    method: 'POST',
    url: '/auth/send_otp',
    body: body,
    failOnStatusCode: false,
    headers: {
      'Content-Type': 'application/json',
    },
  });
});

Cypress.Commands.add('verifyOTP', (body) => {
  cy.request({
    method: 'POST',
    url: '/auth/verify_otp',
    body: body,
    failOnStatusCode: false,
    headers: {
      'Content-Type': 'application/json',
    },
  });
});

Cypress.Commands.add('uploadFile', (filePath) => {
  return cy.fixture(filePath, 'base64').then((fileContent) => {
    const blob = Cypress.Blob.base64StringToBlob(fileContent, 'image/jpeg');
    return blob;
  });
});

Cypress.Commands.add('signUp', (signupData) => {
  cy.fixture(`images/${signupData.files}`, 'binary').then((image) => {
    const blob = Cypress.Blob.binaryStringToBlob(image, 'image/jpeg');

    const formData = new FormData();

    formData.append('files', blob, signupData.files);

    formData.append('username', signupData.username);
    formData.append('email', signupData.email);
    formData.append('files_meta', signupData.files_meta);
    formData.append('dob', signupData.dob);
    formData.append('is_show_gender', signupData.is_show_gender);
    formData.append('selfie_filename', signupData.selfie_filename);
    formData.append('gender', signupData.gender);
    formData.append('device_id', signupData.device_id);
    formData.append('fcm_token', signupData.fcm_token);
    formData.append('join_location', signupData.join_location);

    console.log('Isi FormData:');
    for (let pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }

    return cy.request({
      method: 'POST',
      url: '/auth/signup/kby',
      failOnStatusCode: false,
      body: formData,
      headers: {
        // 'Content-Type': 'multipart/form-data',
      },
    });
  });
});

Cypress.Commands.add('ageAndzodiac', ({ dob }) => {
  cy.request({
    method: 'GET',
    url: `/auth/age_zodiac?dob=${dob}`,
    failOnStatusCode: false,
    headers: {
      'Content-Type': 'application/json',
    },
  });
});

Cypress.Commands.add('refreshToken', (body) => {
  cy.request({
    method: 'POST',
    url: '/auth/refresh_token',
    body: body,
    failOnStatusCode: false,
    headers: {
      'Content-Type': 'application/json',
    },
  });
});
