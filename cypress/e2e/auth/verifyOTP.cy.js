describe('API testing verify OTP', () => {
  let testCases;

  before(() => {
    cy.fixture('verifyOTP.json').then((data) => {
      testCases = data;
    });
  });

  // case 1
  it('Verify OTP with all valid inputs and status account is unregistered', () => {
    const { device_id, platform } = testCases.case_1.data;

    cy.generateRandomMailGwEmail().then((email) => {
      const userEmail = email;

      cy.log(`Generated Email: ${userEmail}`);

      cy.createMailGwAccount(userEmail).then((response) => {
        if (response.status === 201) {
          cy.log('Mail.gw account created successfully');
        } else if (response.status === 422) {
          cy.log('Account may already exist, attempting to continue');
        } else {
          expect(response.status).to.be.oneOf([201, 422]);
        }

        cy.generateRandomFCMToken().then((fcmToken) => {
          cy.log(`Generated FCM Token: ${fcmToken}`);

          cy.sendOTP({
            email: userEmail,
            device_id,
            fcm_token: fcmToken,
            platform,
          }).then((response) => {
            expect(response.status).to.eq(200);
            cy.wait(15000);
            cy.getLatestOTPFromMailGw(userEmail).then(() => {
              cy.get('@otpCode').then((otp) => {
                cy.verifyOTP({
                  email: userEmail,
                  otp,
                  device_id,
                  fcm_token: fcmToken,
                  platform,
                }).then((response) => {
                  expect(response.body).to.have.property('error').to.be.false;
                  expect(response.body).to.have.property('status').to.equal(1);
                  expect(response.body).to.have.property('code').to.equal(200);

                  const { data } = response.body;
                  expect(data).to.have.property('is_otp_valid').to.be.true;
                  expect(data).to.have.property('is_account_available').to.be
                    .false;
                  expect(data).to.have.property('is_properties_set').to.be
                    .false;

                  expect(response.body)
                    .to.have.property('message')
                    .to.equal('Success verify otp');
                });
              });
            });
          });
        });
      });
    });
  });

  // case 2
  it('Verify OTP for registered account', () => {
    const testData = {
      username: 'dummyTest',
      files: 'test1.jpeg',
      files_meta: '[{"filename":"test1.jpeg","order":0}]',
      dob: '2001-04-11',
      is_show_gender: '0',
      selfie_filename:
        'selfie/052019512329ac39e7f53999bd7956831724147883682.png',
      gender: '1',
      device_id: 'postman_localhost',
      join_location: 'jakarta',
    };

    const platform = 'ios';

    cy.generateRandomMailGwEmail().then((email) => {
      const userEmail = email;
      cy.log(`Generated Email: ${userEmail}`);

      cy.createMailGwAccount(userEmail).then((response) => {
        if (response.status === 201) {
          cy.log('Mail.gw account created successfully');
        } else if (response.status === 422) {
          cy.log('Account may already exist, attempting to continue');
        } else {
          expect(response.status).to.be.oneOf([201, 422]);
        }

        cy.generateRandomFCMToken().then((fcmToken) => {
          cy.log(`Generated FCM Token: ${fcmToken}`);

          cy.sendOTP({
            email: userEmail,
            device_id: testData.device_id,
            fcm_token: fcmToken,
            platform,
          }).then((response) => {
            expect(response.status).to.eq(200);

            // Wait for the email to arrive
            cy.wait(15000); // Increased wait time for email to arrive

            // Get OTP from mail.gw
            cy.getLatestOTPFromMailGw(userEmail).then(() => {
              cy.get('@otpCode').then((otp) => {
                cy.log(`OTP: ${otp}`);

                cy.verifyOTP({
                  email: userEmail,
                  otp,
                  device_id: testData.device_id,
                  fcm_token: fcmToken,
                  platform,
                }).then((response) => {
                  expect(response.body).to.have.property('code').to.equal(200);

                  const signupData = {
                    email: userEmail,
                    fcm_token: fcmToken,
                    ...testData,
                  };

                  cy.signUp(signupData).then((response) => {
                    const text = new TextDecoder().decode(response.body);
                    try {
                      const jsonResponse = JSON.parse(text);
                      console.log('Response Body (Parsed JSON):', jsonResponse);

                      expect(jsonResponse).to.have.property('code', 200);
                      expect(jsonResponse).to.have.property('status', 1);
                      expect(jsonResponse).to.have.property('error', false);
                      expect(jsonResponse).to.have.property(
                        'message',
                        'Success kby signup'
                      );
                    } catch (error) {
                      console.log('Response Body (Raw Text):', text);
                    }
                    cy.generateRandomFCMToken().then((fcmToken) => {
                      cy.log(`Generated FCM Token: ${fcmToken}`);

                      cy.sendOTP({
                        email: userEmail,
                        device_id: testData.device_id,
                        fcm_token: fcmToken,
                        platform,
                      }).then((response) => {
                        expect(response.status).to.eq(200);
                        cy.wait(15000);
                        cy.getLatestOTPFromMailGw(userEmail).then(() => {
                          cy.get('@otpCode').then((otp) => {
                            cy.verifyOTP({
                              email,
                              otp,
                              device_id: testData.device_id,
                              fcm_token: fcmToken,
                              platform,
                            }).then((response) => {
                              expect(response.body).to.have.property('error').to
                                .be.false;
                              expect(response.body)
                                .to.have.property('status')
                                .to.equal(1);
                              expect(response.body)
                                .to.have.property('code')
                                .to.equal(200);
                              expect(response.body)
                                .to.have.property('message')
                                .to.equal('Success verify otp');

                              const { data } = response.body;
                              expect(data).to.have.property('is_otp_valid').to
                                .be.true;
                              expect(data).to.have.property(
                                'is_account_available'
                              ).to.be.true;
                              expect(data).to.have.property('is_properties_set')
                                .to.be.false;
                              expect(data)
                                .to.have.property('access_token')
                                .to.be.a('string').and.not.empty;
                              expect(data)
                                .to.have.property('refresh_token')
                                .to.be.a('string').and.not.empty;

                              const { user_data } = data;
                              expect(user_data).to.be.an('object');
                              expect(user_data)
                                .to.have.property('id')
                                .to.be.a('string').and.not.empty;
                              expect(user_data)
                                .to.have.property('username')
                                .to.be.a('string');
                              expect(user_data)
                                .to.have.property('is_verified')
                                .to.be.a('boolean');
                              expect(user_data)
                                .to.have.property('is_premium')
                                .to.be.a('boolean');
                              expect(user_data)
                                .to.have.property('dob')
                                .to.match(/^\d{4}-\d{2}-\d{2}$/);
                              expect(user_data)
                                .to.have.property('gender')
                                .to.be.a('number');
                              expect(user_data).to.have.property('description');

                              expect(user_data.photo_profile).to.be.an('array')
                                .that.is.not.empty;
                              user_data.photo_profile.forEach((photo) => {
                                expect(photo).to.include.all.keys([
                                  'url',
                                  'name',
                                  'size',
                                  'order',
                                  'mimetype',
                                  'verified',
                                  'originalname',
                                  'similarity',
                                ]);
                              });

                              expect(user_data).to.have.property('smoke');
                              expect(user_data).to.have.property('drink');
                              expect(user_data).to.have.property('exercise');
                              expect(user_data).to.have.property('height');

                              expect(user_data.profile_settings)
                                .to.have.property('is_show_gender')
                                .to.be.a('boolean');

                              expect(
                                user_data.photo_selfie
                              ).to.include.all.keys(['url', 'name', 'size']);
                              expect(user_data.photo_selfie.url).to.include(
                                'https://'
                              );
                              expect(user_data.photo_selfie.name).to.be.a(
                                'string'
                              );
                              expect(user_data.photo_selfie.size).to.be.a(
                                'number'
                              );

                              expect(user_data).to.have.property('latitude');
                              expect(user_data).to.have.property('longitude');

                              expect(user_data).to.have.property('zodiac');
                              expect(user_data).to.have.property('edu_level');
                              expect(user_data).to.have.property('industry');
                              expect(user_data).to.have.property('interest');
                              expect(user_data).to.have.property(
                                'love_language'
                              );
                              expect(user_data).to.have.property('mbti');
                              expect(user_data).to.have.property('pet');
                              expect(user_data).to.have.property('religion');
                              expect(user_data).to.have.property('sport');

                              expect(user_data)
                                .to.have.property('timezone_preffered_abbrev')
                                .to.be.a('string');
                              expect(user_data)
                                .to.have.property('timezone_preffered_region')
                                .to.be.a('string');
                              expect(user_data)
                                .to.have.property('created_at')
                                .to.match(
                                  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/
                                );
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  //case 3
  it('Verify OTP with empty OTP code', () => {
    const { email, device_id, otp, fcm_token, platform } =
      testCases.case_3.data;
    cy.verifyOTP({ email, device_id, otp, fcm_token, platform }).then(
      (response) => {
        expect(response.body)
          .to.have.property('name')
          .to.equal('BadRequestError');
        expect(response.body).to.have.property('code').to.equal(400);
        expect(response.body).to.have.property('status').to.equal(0);
        expect(response.body).to.have.property('data');
        expect(response.body)
          .to.have.property('message')
          .to.equal('Email and otp are required');
        expect(response.body).to.have.property('error').to.be.true;
      }
    );
  });

  // case 4
  it('Verify OTP with incorrect OTP code', () => {
    const { email, device_id, otp, fcm_token, platform } =
      testCases.case_4.data;

    cy.sendOTP({ email }).then((response) => {
      expect(response.status).to.eq(200);
    });

    cy.verifyOTP({ email, device_id, otp, fcm_token, platform }).then(
      (response) => {
        expect(response.body)
          .to.have.property('name')
          .to.equal('BadRequestError');
        expect(response.body).to.have.property('code').to.equal(400);
        expect(response.body).to.have.property('status').to.equal(0);
        expect(response.body).to.have.property('data');
        expect(response.body)
          .to.have.property('message')
          .to.equal('Otp is not valid');
        expect(response.body).to.have.property('error').to.be.true;
      }
    );
  });

  // case 5
  it('Verify OTP with invalid email format', () => {
    const { email, device_id, otp, fcm_token, platform } =
      testCases.case_5.data;
    cy.verifyOTP({ email, device_id, otp, fcm_token, platform }).then(
      (response) => {
        expect(response.body)
          .to.have.property('name')
          .to.equal('BadRequestError');
        expect(response.body).to.have.property('code').to.equal(400);
        expect(response.body).to.have.property('status').to.equal(0);
        expect(response.body).to.have.property('data');
        expect(response.body)
          .to.have.property('message')
          .to.equal('Email is not valid');
        expect(response.body).to.have.property('error').to.be.true;
      }
    );
  });

  // case 6
  it('Verify otp with otp already verify', () => {
    const { device_id, platform } = testCases.case_6.data;

    cy.generateRandomMailGwEmail().then((email) => {
      const userEmail = email;

      cy.log(`Generated Email: ${userEmail}`);

      cy.createMailGwAccount(userEmail).then((response) => {
        if (response.status === 201) {
          cy.log('Mail.gw account created successfully');
        } else if (response.status === 422) {
          cy.log('Account may already exist, attempting to continue');
        } else {
          expect(response.status).to.be.oneOf([201, 422]);
        }

        cy.generateRandomFCMToken().then((fcmToken) => {
          cy.log(`Generated FCM Token: ${fcmToken}`);

          cy.sendOTP({
            email: userEmail,
            device_id,
            fcm_token: fcmToken,
            platform,
          }).then((response) => {
            expect(response.status).to.eq(200);
            cy.wait(15000);
            cy.getLatestOTPFromMailGw(userEmail).then(() => {
              cy.get('@otpCode').then((otp) => {
                cy.verifyOTP({
                  email: userEmail,
                  otp,
                  device_id,
                  fcm_token: fcmToken,
                  platform,
                }).then((response) => {
                  expect(response.body).to.have.property('error').to.be.false;
                  expect(response.body).to.have.property('status').to.equal(1);
                  expect(response.body).to.have.property('code').to.equal(200);
                });
                cy.verifyOTP({
                  email,
                  otp,
                  device_id,
                  fcm_token: fcmToken,
                  platform,
                }).then((response) => {
                  expect(response.body)
                    .to.have.property('name')
                    .to.equal('BadRequestError');
                  expect(response.body).to.have.property('code').to.equal(400);
                  expect(response.body).to.have.property('status').to.equal(0);
                  expect(response.body).to.have.property('data');
                  expect(response.body)
                    .to.have.property('message')
                    .to.equal('Otp already verified');
                  expect(response.body).to.have.property('error').to.be.true;
                });
              });
            });
          });
        });
      });
    });
  });
});
