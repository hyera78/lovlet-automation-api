import easyYopmail from 'easy-yopmail';
import 'cypress-iframe';
import 'cypress-file-upload';

Cypress.Commands.add('generateRandomMailGwEmail', () => {
  return cy
    .request({
      method: 'GET',
      url: 'https://api.mail.gw/domains',
    })
    .then((response) => {
      expect(response.status).to.eq(200);
      const domains = response.body['hydra:member'];

      const activeDomain =
        domains.find((domain) => domain.isActive) || domains[0];
      const domainName = activeDomain.domain;

      const randomString = Math.random().toString(36).substring(2, 10);
      const email = `${randomString}@${domainName}`;

      return cy.wrap(email);
    });
});

Cypress.Commands.add(
  'createMailGwAccount',
  (email, password = 'Test123456') => {
    return cy
      .request({
        method: 'POST',
        url: 'https://api.mail.gw/accounts',
        body: {
          address: email,
          password: password,
        },
        failOnStatusCode: false,
      })
      .then((response) => {
        cy.log(`Account creation status: ${response.status}`);
        if (response.status !== 201) {
          cy.log(`Error response: ${JSON.stringify(response.body)}`);
        }
        return cy.wrap(response);
      });
  }
);

Cypress.Commands.add('getMailGwToken', (email, password = 'Test123456') => {
  return cy
    .request({
      method: 'POST',
      url: 'https://api.mail.gw/token',
      body: {
        address: email,
        password: password,
      },
      failOnStatusCode: false,
    })
    .then((response) => {
      cy.log(`Token request status: ${response.status}`);
      if (response.status !== 200) {
        cy.log(`Token error: ${JSON.stringify(response.body)}`);
      }

      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('token');
      return cy.wrap(response.body.token);
    });
});

Cypress.Commands.add(
  'getLatestOTPFromMailGw',
  (email, password = 'Test123456') => {
    return cy.getMailGwToken(email, password).then((token) => {
      return cy
        .request({
          method: 'GET',
          url: 'https://api.mail.gw/messages',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          expect(response.status).to.eq(200);
          console.log('isi email :', response);

          if (response.body['hydra:totalItems'] > 0) {
            const latestMessageId = response.body['hydra:member'][0].id;

            return cy
              .request({
                method: 'GET',
                url: `https://api.mail.gw/messages/${latestMessageId}`,
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              })
              .then((messageResponse) => {
                expect(messageResponse.status).to.eq(200);
                const emailText = messageResponse.body.text;
                console.log('Text :', emailText);

                // Extract OTP code using regex
                const otpMatch = emailText.match(
                  /verification code is ([a-z0-9]+)/i
                );
                if (otpMatch && otpMatch[1]) {
                  const otpCode = otpMatch[1];
                  cy.log(`Extracted OTP: ${otpCode}`);
                  // Store OTP for later use
                  cy.wrap(otpCode).as('otpCode');
                } else {
                  throw new Error('OTP code not found in email text!');
                }
              });
          } else {
            throw new Error('No emails found in inbox!');
          }
        });
    });
  }
);

Cypress.Commands.add('generateRandomFCMToken', (length = 32) => {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return cy.wrap(result);
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
  const createFormData = (data, imageBlob = null) => {
    const formData = new FormData();

    if (imageBlob) {
      formData.append('files', imageBlob, data.files);
    }

    const fields = [
      'username',
      'email',
      'files_meta',
      'dob',
      'is_show_gender',
      'selfie_filename',
      'gender',
      'device_id',
      'fcm_token',
      'join_location',
    ];

    fields.forEach((field) => {
      if (data[field] !== undefined && data[field] !== '') {
        formData.append(field, data[field]);
      }
    });

    console.log('Isi FormData:');
    for (let pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }

    return formData;
  };

  if (!signupData.files) {
    const formData = createFormData(signupData);

    return cy.request({
      method: 'POST',
      url: '/auth/signup/kby',
      failOnStatusCode: false,
      body: formData,
      headers: {},
    });
  }

  return cy.fixture(`images/${signupData.files}`, 'binary').then((image) => {
    const blob = Cypress.Blob.binaryStringToBlob(image, 'image/jpeg');
    const formData = createFormData(signupData, blob);

    return cy.request({
      method: 'POST',
      url: '/auth/signup/kby',
      failOnStatusCode: false,
      body: formData,
      headers: {},
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

Cypress.Commands.add('addFCMToken', (body) => {
  const accessToken = Cypress.env('accessToken');

  if (!accessToken) {
    throw new Error('Access token is required');
  }
  cy.request({
    method: 'POST',
    url: '/auth/messaging/token',
    body: body,
    failOnStatusCode: false,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
});

Cypress.Commands.add('sendOTPRecovery', (body) => {
  cy.request({
    method: 'POST',
    url: '/auth/send_otp/recovery',
    body: body,
    failOnStatusCode: false,
    headers: {
      'Content-Type': 'application/json',
    },
  });
});

Cypress.Commands.add('getDeleteAccountMessage', (body) => {
  const accessToken = Cypress.env('accessToken');

  if (!accessToken) {
    throw new Error('Access token is required');
  }

  cy.request({
    method: 'GET',
    url: '/user/delete/message',
    body: body,
    failOnStatusCode: false,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
});

Cypress.Commands.add('deleteAccount', (body) => {
  const accessToken = Cypress.env('accessToken');

  if (!accessToken) {
    throw new Error('Access token is required');
  }

  cy.request({
    method: 'DELETE',
    url: '/user/delete/account',
    body: body,
    failOnStatusCode: false,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
});

Cypress.Commands.add('lookingFor', () => {
  const accessToken = Cypress.env('accessToken');

  if (!accessToken) {
    throw new Error('Access token is required');
  }

  cy.request({
    method: 'GET',
    url: '/user/looking_for?limit=4&offset=1',
    failOnStatusCode: false,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
});

Cypress.Commands.add('loveLanguage', () => {
  const accessToken = Cypress.env('accessToken');

  if (!accessToken) {
    throw new Error('Access token is required');
  }

  cy.request({
    method: 'GET',
    url: '/user/love_language?limit=1&offset=1',
    failOnStatusCode: false,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
});

Cypress.Commands.add('interest', () => {
  const accessToken = Cypress.env('accessToken');

  if (!accessToken) {
    throw new Error('Access token is required');
  }

  cy.request({
    method: 'GET',
    url: '/user/interest?limit=5&offset=6',
    failOnStatusCode: false,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
});

Cypress.Commands.add('industry', () => {
  const accessToken = Cypress.env('accessToken');

  if (!accessToken) {
    throw new Error('Access token is required');
  }

  cy.request({
    method: 'GET',
    url: '/user/industry?limit=5&offset=1',
    failOnStatusCode: false,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
});

Cypress.Commands.add('mbti', () => {
  const accessToken = Cypress.env('accessToken');

  if (!accessToken) {
    throw new Error('Access token is required');
  }

  cy.request({
    method: 'GET',
    url: '/user/mbti?limit=5&offset=1',
    failOnStatusCode: false,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
});

Cypress.Commands.add('pet', () => {
  const accessToken = Cypress.env('accessToken');

  if (!accessToken) {
    throw new Error('Access token is required');
  }

  cy.request({
    method: 'GET',
    url: '/user/pet?limit=5&offset=1',
    failOnStatusCode: false,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
});

Cypress.Commands.add('religion', () => {
  const accessToken = Cypress.env('accessToken');

  if (!accessToken) {
    throw new Error('Access token is required');
  }

  cy.request({
    method: 'GET',
    url: '/user/religion?limit=5&offset=1',
    failOnStatusCode: false,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
});

Cypress.Commands.add('sport', () => {
  const accessToken = Cypress.env('accessToken');

  if (!accessToken) {
    throw new Error('Access token is required');
  }

  cy.request({
    method: 'GET',
    url: '/user/sport?limit=5&offset=1',
    failOnStatusCode: false,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
});

Cypress.Commands.add('eduLevel', () => {
  const accessToken = Cypress.env('accessToken');

  if (!accessToken) {
    throw new Error('Access token is required');
  }

  cy.request({
    method: 'GET',
    url: '/user/edu_level?limit=5&offset=1',
    failOnStatusCode: false,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
});

Cypress.Commands.add('zodiac', () => {
  const accessToken = Cypress.env('accessToken');

  if (!accessToken) {
    throw new Error('Access token is required');
  }

  cy.request({
    method: 'GET',
    url: '/user/zodiac?limit=5&offset=1',
    failOnStatusCode: false,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
});

Cypress.Commands.add('prefferedTimezone', () => {
  const accessToken = Cypress.env('accessToken');

  if (!accessToken) {
    throw new Error('Access token is required');
  }

  cy.request({
    method: 'GET',
    url: '/user/timezone',
    failOnStatusCode: false,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
});

Cypress.Commands.add('passiveLivenessKBY', (passiveData) => {
  const createFormData = (data, imageBlob = null) => {
    const formData = new FormData();

    if (imageBlob) {
      formData.append('file', imageBlob, data.file);
    }

    const fields = ['file', 'file_meta'];

    fields.forEach((field) => {
      if (data[field] !== undefined && data[field] !== '') {
        formData.append(field, data[field]);
      }
    });

    console.log('Isi FormData:');
    for (let pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }

    return formData;
  };

  if (!passiveData.file) {
    const formData = createFormData(passiveData);

    return cy.request({
      method: 'POST',
      url: '/external/passive_liveness/kby',
      failOnStatusCode: false,
      body: formData,
      headers: {},
    });
  }

  return cy.fixture(`images/${passiveData.file}`, 'binary').then((image) => {
    const blob = Cypress.Blob.binaryStringToBlob(image, 'image/jpeg');
    const formData = createFormData(passiveData, blob);

    return cy.request({
      method: 'POST',
      url: '/external/passive_liveness/kby',
      failOnStatusCode: false,
      body: formData,
      headers: {},
    });
  });
});
