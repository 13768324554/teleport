"use strict";

$app.on_init = function (cb_stack) {
    console.log($app.options);

    $app.dlg_result = $app.create_dlg_result();
    // cb_stack.add($app.dlg_result.init);

    $app.smtp = $app.create_config_smtp();
    cb_stack.add($app.smtp.init);

    $app.sec = $app.create_config_sec();
    cb_stack.add($app.sec.init);

    $app.storage = $app.create_config_storage();
    cb_stack.add($app.storage.init);

    cb_stack.exec();
};

$app.create_dlg_result = function () {
    var _dlg = {};

    _dlg.dom = {
        dlg: $('#dlg-result'),
        title: $('#dlg-result-title'),
        msg: $('#dlg-result-msg')
    };

    _dlg.show = function(title, msg) {
        _dlg.dom.title.text(title);
        _dlg.dom.msg.html(msg);
        _dlg.dom.dlg.modal();
    };

    return _dlg;
};

$app.create_config_smtp = function () {
    var _smtp = {};

    _smtp.dom = {
        server: $('#smtp-server-info'),
        port: $('#smtp-port-info'),
        ssl: $('#smtp-ssl-info'),
        sender: $('#smtp-sender-info'),
        btn_edit: $('#btn-edit-mail-config'),

        dlg_edit: $('#dlg-edit-smtp-config'),
        input_server: $('#edit-smtp-server'),
        input_port: $('#edit-smtp-port'),
        input_ssl: $('#edit-smtp-ssl'),
        input_sender: $('#edit-smtp-sender'),
        input_password: $('#edit-smtp-password'),
        input_recipient: $('#edit-smtp-test-recipient'),
        btn_send: $('#btn-send-test-mail'),
        msg_send: $('#msg-send-test-mail'),
        btn_save: $('#btn-save-mail-config')
    };

    _smtp.init = function (cb_stack) {
        _smtp.update_dom($app.options.sys_cfg.smtp);

        _smtp.dom.btn_edit.click(function () {
            _smtp.on_edit();
        });
        _smtp.dom.btn_send.click(function () {
            _smtp.on_btn_send();
        });
        _smtp.dom.btn_save.click(function () {
            _smtp.on_btn_save();
        });
        _smtp.dom.input_ssl.click(function () {
            if ($(this).hasClass('tp-selected'))
                $(this).removeClass('tp-selected');
            else
                $(this).addClass('tp-selected');
        });

        cb_stack.exec();
    };

    _smtp.update_dom = function (smtp) {
        if (0 === smtp.server.length) {
            var not_set = '<span class="error">未设置</span>';
            _smtp.dom.server.html(not_set);
            _smtp.dom.port.html(not_set);
            _smtp.dom.ssl.html(not_set);
            _smtp.dom.sender.html(not_set);
        } else {
            _smtp.dom.server.html(smtp.server);
            _smtp.dom.port.html(smtp.port);
            _smtp.dom.sender.html(smtp.sender);
            _smtp.dom.ssl.html(smtp.ssl ? '是' : '否');
        }
    };

    _smtp.on_edit = function () {
        var smtp = $app.options.sys_cfg.smtp;

        _smtp.dom.input_server.val(smtp.server);

        _smtp.dom.input_port.val(smtp.port);

        if (!smtp.ssl)
            _smtp.dom.input_ssl.removeClass('tp-selected');
        else
            _smtp.dom.input_ssl.removeClass('tp-selected').addClass('tp-selected');

        _smtp.dom.input_sender.val(smtp.sender);
        _smtp.dom.input_password.val('');

        _smtp.dom.dlg_edit.modal();
    };

    _smtp._check_input = function (_server, _port, _sender, _password) {
        if (_server.length === 0) {
            _smtp.dom.input_server.focus();
            $tp.notify_error('请填写SMTP服务器地址！');
            return false;
        }
        if (_port.length === 0) {
            _smtp.dom.input_port.focus();
            $tp.notify_error('请填写SMTP服务器端口！');
            return false;
        }
        if (_sender.length === 0) {
            _smtp.dom.input_sender.focus();
            $tp.notify_error('请填写发件人邮箱！');
            return false;
        }
        if (_password.length === 0) {
            _smtp.dom.input_password.focus();
            $tp.notify_error('请填写发件人邮箱密码！');
            return false;
        }

        return true;
    };

    _smtp.on_btn_send = function () {
        var _server = _smtp.dom.input_server.val();
        var _port = _smtp.dom.input_port.val();
        var _sender = _smtp.dom.input_sender.val();
        var _password = _smtp.dom.input_password.val();
        var _recipient = _smtp.dom.input_recipient.val();
        var _ssl = _smtp.dom.input_ssl.hasClass('tp-selected');

        if (!_smtp._check_input(_server, _port, _sender, _password))
            return;
        if (_recipient.length === 0) {
            _smtp.dom.input_recipient.focus();
            $tp.notify_error('请填写测试收件人邮箱！');
            return;
        }

        _smtp.dom.btn_send.attr('disabled', 'disabled');

        $tp.ajax_post_json('/system/send-test-mail',
            {
                server: _server,
                port: _port,
                ssl: _ssl,
                sender: _sender,
                password: _password,
                recipient: _recipient
            },
            function (ret) {
                _smtp.dom.btn_send.removeAttr('disabled');
                if (ret.code === TPE_OK) {
                    _smtp.dom.msg_send.slideDown('fast');
                } else {
                    $tp.notify_error(tp_error_msg(ret.code, ret.message));
                }
            },
            function () {
                _smtp.dom.btn_send.removeAttr('disabled');
                $tp.notify_error('网路故障，无法连接到服务器！');
            },
            15000
        );
    };

    _smtp.on_btn_save = function () {
        var _server = _smtp.dom.input_server.val();
        var _port = _smtp.dom.input_port.val();
        var _sender = _smtp.dom.input_sender.val();
        var _password = _smtp.dom.input_password.val();
        var _ssl = _smtp.dom.input_ssl.hasClass('tp-selected');

        if (!_smtp._check_input(_server, _port, _sender, _password))
            return;

        _smtp.dom.btn_save.attr('disabled', 'disabled');
        $tp.ajax_post_json('/system/save-cfg',
            {
                smtp: {
                    server: _server,
                    port: _port,
                    ssl: _ssl,
                    sender: _sender,
                    password: _password
                }
            },
            function (ret) {
                _smtp.dom.btn_save.removeAttr('disabled');
                if (ret.code === TPE_OK) {
                    $tp.notify_success('SMTP设置更新成功！');

                    _smtp.dom.input_password.val('');
                    // 更新一下界面上显示的配置信息
                    $app.options.sys_cfg.smtp.server = _server;
                    $app.options.sys_cfg.smtp.port = _port;
                    $app.options.sys_cfg.smtp.ssl = _ssl;
                    $app.options.sys_cfg.smtp.sender = _sender;
                    _smtp.update_dom($app.options.sys_cfg.smtp);

                    _smtp.dom.dlg_edit.modal('hide');

                } else {
                    $tp.notify_error('SMTP设置更新失败：' + tp_error_msg(ret.code, ret.message));
                }
            },
            function () {
                _smtp.dom.btn_save.removeAttr('disabled');
                $tp.notify_error('网路故障，SMTP设置更新失败！');
            }
        );
    };

    return _smtp;
};

$app.create_config_sec = function () {
    var _sec = {};

    _sec.dom = {
        btn_save: $('#btn-save-secure-config'),

        btn_password_allow_reset: $('#sec-allow-reset-password'),
        btn_password_force_strong: $('#sec-force-strong-password'),
        input_password_timeout: $('#sec-password-timeout'),

        input_session_timeout: $('#sec-session-timeout'),
        input_login_retry: $('#sec-login-retry'),
        input_lock_timeout: $('#sec-lock-timeout'),
        btn_auth_username_password: $('#sec-auth-username-password'),
        btn_auth_username_password_captcha: $('#sec-auth-username-password-captcha'),
        btn_auth_username_oath: $('#sec-auth-username-oath'),
        btn_auth_username_password_oath: $('#sec-auth-username-password-oath')
    };

    _sec.init = function (cb_stack) {
        _sec.update_dom_password($app.options.sys_cfg.password);
        _sec.update_dom_login($app.options.sys_cfg.login);

        $('#tab-security').find('.tp-checkbox.tp-editable').click(function () {
            if ($(this).hasClass('tp-selected'))
                $(this).removeClass('tp-selected');
            else
                $(this).addClass('tp-selected');
        });

        _sec.dom.btn_save.click(function () {
            _sec.on_btn_save();
        });

        cb_stack.exec();
    };

    _sec.update_dom_password = function (password) {
        _sec.dom.btn_password_allow_reset.removeClass('tp-selected');
        if (password.allow_reset)
            _sec.dom.btn_password_allow_reset.addClass('tp-selected');

        _sec.dom.btn_password_force_strong.removeClass('tp-selected');
        if (password.force_strong)
            _sec.dom.btn_password_force_strong.addClass('tp-selected');

        _sec.dom.input_password_timeout.val(password.timeout);
    };

    _sec.update_dom_login = function (login) {
        _sec.dom.input_session_timeout.val(login.session_timeout);
        _sec.dom.input_login_retry.val(login.retry);
        _sec.dom.input_lock_timeout.val(login.lock_timeout);

        _sec.dom.btn_auth_username_password.removeClass('tp-selected');
        if (login.auth & TP_LOGIN_AUTH_USERNAME_PASSWORD)
            _sec.dom.btn_auth_username_password.addClass('tp-selected');
        if (login.auth & TP_LOGIN_AUTH_USERNAME_PASSWORD_CAPTCHA)
            _sec.dom.btn_auth_username_password_captcha.addClass('tp-selected');
        if (login.auth & TP_LOGIN_AUTH_USERNAME_OATH)
            _sec.dom.btn_auth_username_oath.addClass('tp-selected');
        if (login.auth & TP_LOGIN_AUTH_USERNAME_PASSWORD_OATH)
            _sec.dom.btn_auth_username_password_oath.addClass('tp-selected');
    };

    _sec.on_btn_save = function () {
        var _password_allow_reset = _sec.dom.btn_password_allow_reset.hasClass('tp-selected');
        var _password_force_strong = _sec.dom.btn_password_force_strong.hasClass('tp-selected');
        var _password_timeout = parseInt(_sec.dom.input_password_timeout.val());

        var _login_session_timeout = parseInt(_sec.dom.input_session_timeout.val());
        var _login_retry = parseInt(_sec.dom.input_login_retry.val());
        var _login_lock_timeout = parseInt(_sec.dom.input_lock_timeout.val());

        var _login_auth = 0;
        if (_sec.dom.btn_auth_username_password.hasClass('tp-selected'))
            _login_auth |= TP_LOGIN_AUTH_USERNAME_PASSWORD;
        if (_sec.dom.btn_auth_username_password_captcha.hasClass('tp-selected'))
            _login_auth |= TP_LOGIN_AUTH_USERNAME_PASSWORD_CAPTCHA;
        if (_sec.dom.btn_auth_username_oath.hasClass('tp-selected'))
            _login_auth |= TP_LOGIN_AUTH_USERNAME_OATH;
        if (_sec.dom.btn_auth_username_password_oath.hasClass('tp-selected'))
            _login_auth |= TP_LOGIN_AUTH_USERNAME_PASSWORD_OATH;

        if (_.isNaN(_password_timeout) || _password_timeout < 0 || _password_timeout > 180) {
            $tp.notify_error('密码有效期超出范围！');
            _sec.dom.input_password_timeout.focus();
            return;
        }
        if (_.isNaN(_login_session_timeout) || _login_session_timeout < 5 || _login_session_timeout > 1440) {
            $tp.notify_error('WEB会话超时超出范围！');
            _sec.dom.input_session_timeout.focus();
            return;
        }
        if (_.isNaN(_login_retry) || _login_retry < 0 || _login_retry > 10) {
            $tp.notify_error('密码尝试次数超出范围！');
            _sec.dom.input_login_retry.focus();
            return;
        }
        if (_.isNaN(_login_lock_timeout) || _login_lock_timeout < 0 || _login_lock_timeout > 9999) {
            $tp.notify_error('临时锁定时长超出范围！');
            _sec.dom.input_lock_timeout.focus();
            return;
        }

        _sec.dom.btn_save.attr('disabled', 'disabled');
        $tp.ajax_post_json('/system/save-cfg',
            {
                password: {
                    allow_reset: _password_allow_reset,
                    force_strong: _password_force_strong,
                    timeout: _password_timeout
                },
                login: {
                    session_timeout: _login_session_timeout,
                    retry: _login_retry,
                    lock_timeout: _login_lock_timeout,
                    auth: _login_auth
                }
            },
            function (ret) {
                _sec.dom.btn_save.removeAttr('disabled');
                if (ret.code === TPE_OK) {
                    $tp.notify_success('安全设置更新成功！');

                    // 更新一下界面上显示的配置信息
                    $app.options.sys_cfg.password.allow_reset = _password_allow_reset;
                    $app.options.sys_cfg.password.force_strong = _password_force_strong;
                    $app.options.sys_cfg.password.timeout = _password_timeout;

                    $app.options.sys_cfg.login.session_timeout = _login_session_timeout;
                    $app.options.sys_cfg.login.retry = _login_retry;
                    $app.options.sys_cfg.login.lock_timeout = _login_lock_timeout;
                    $app.options.sys_cfg.login.auth = _login_auth;

                    _sec.update_dom_password($app.options.sys_cfg.password);
                    _sec.update_dom_login($app.options.sys_cfg.login);
                } else {
                    $tp.notify_error('安全设置更新失败：' + tp_error_msg(ret.code, ret.message));
                }
            },
            function () {
                _sec.dom.btn_save.removeAttr('disabled');
                $tp.notify_error('网路故障，安全设置更新失败！');
            }
        );

    };

    return _sec;
};

$app.create_config_storage = function () {
    var _sto = {};

    _sto.dom = {
        storage_size: $('#storage-size'),
        btn_save: $('#btn-save-storage-config'),
        btn_cleanup: $('#btn-clear-storage'),

        input_keep_log: $('#storage-keep-log'),
        input_keep_record: $('#storage-keep-record'),
        select_cleanup_hour: $('#select-cleanup-storage-hour'),
        select_cleanup_minute: $('#select-cleanup-storage-minute')
    };

    _sto.init = function (cb_stack) {
        // 当前会话录像存储空间：总 123.35GB，可用空间 85.17GB。
        var _info = [];
        if (!$app.options.core_cfg.detected) {
            _sto.dom.storage_size.removeClass().addClass('alert alert-danger');
            _info.push('未能连接到核心服务，无法获取存储空间信息！');
        } else {
            _sto.dom.storage_size.removeClass().addClass('alert alert-info');
            _info.push('<p>会话录像存储路径：<code>' + $app.options.core_cfg.replay_path + '</code></p>');
            _info.push('<p>会话录像存储空间：总 ' + tp_size2str($app.options.total_size, 2) + '，' + '可用 ' + tp_size2str($app.options.free_size, 2) + '。</p>');
        }
        _sto.dom.storage_size.html(_info.join(''));

        _sto.update_dom($app.options.sys_cfg.storage);

        _sto.dom.btn_save.click(function () {
            _sto.on_btn_save();
        });
        _sto.dom.btn_cleanup.click(function () {
            _sto.on_btn_cleanup();
        });

        cb_stack.exec();
    };

    _sto.update_dom = function (storage) {
        _sto.dom.input_keep_log.val(storage.keep_log);
        _sto.dom.input_keep_record.val(storage.keep_record);
        _sto.dom.select_cleanup_hour.val(storage.cleanup_hour);
        _sto.dom.select_cleanup_minute.val(storage.cleanup_minute);
    };

    _sto.on_btn_save = function () {
        var _keep_log = parseInt(_sto.dom.input_keep_log.val());
        var _keep_record = parseInt(_sto.dom.input_keep_record.val());

        var _cleanup_hour = parseInt(_sto.dom.select_cleanup_hour.val());
        var _cleanup_minute = parseInt(_sto.dom.select_cleanup_minute.val());

        if (!(_keep_log === 0 || (_keep_log >= 30 && _keep_log <= 180))) {
            $tp.notify_error('日志保留时间超出范围！');
            _sto.dom.input_keep_log.focus();
            return;
        }
        if (!(_keep_record === 0 || (_keep_record >= 30 && _keep_record <= 180))) {
            $tp.notify_error('会话录像保留时间超出范围！');
            _sto.dom.input_keep_record.focus();
            return;
        }

        _sto.dom.btn_save.attr('disabled', 'disabled');
        $tp.ajax_post_json('/system/save-cfg',
            {
                storage: {
                    keep_log: _keep_log,
                    keep_record: _keep_record,
                    cleanup_hour: _cleanup_hour,
                    cleanup_minute: _cleanup_minute
                }
            },
            function (ret) {
                _sto.dom.btn_save.removeAttr('disabled');
                if (ret.code === TPE_OK) {
                    $tp.notify_success('存储设置更新成功！');

                    // 更新一下界面上显示的配置信息
                    $app.options.sys_cfg.storage.keep_log = _keep_log;
                    $app.options.sys_cfg.storage.keep_record = _keep_record;
                    $app.options.sys_cfg.storage.cleanup_hour = _cleanup_hour;
                    $app.options.sys_cfg.storage.cleanup_minute = _cleanup_minute;

                    _sto.update_dom($app.options.sys_cfg.storage);
                } else {
                    $tp.notify_error('存储设置更新失败：' + tp_error_msg(ret.code, ret.message));
                }
            },
            function () {
                _sto.dom.btn_save.removeAttr('disabled');
                $tp.notify_error('网路故障，存储设置更新失败！');
            }
        );
    };

    _sto.on_btn_cleanup = function () {
        var _keep_log = parseInt(_sto.dom.input_keep_log.val());
        var _keep_record = parseInt(_sto.dom.input_keep_record.val());

        if($app.options.sys_cfg.storage.keep_log !== _keep_log || $app.options.sys_cfg.storage.keep_record !== _keep_record) {
            $tp.notify_error('您已经修改了设置，请先保存设置，再进行清理！');
            return;
        }
        if($app.options.sys_cfg.storage.keep_log === 0 && $app.options.sys_cfg.storage.keep_record === 0) {
            $tp.notify_error('根据设置，没有需要清理的内容！');
            return;
        }

        _sto.dom.btn_cleanup.attr('disabled', 'disabled');
        $tp.ajax_post_json('/system/cleanup-storage', {},
            function (ret) {
                _sto.dom.btn_cleanup.removeAttr('disabled');
                if (ret.code === TPE_OK) {
                    console.log(ret);
                    $tp.notify_success('清理存储空间成功！');

                    var msg = [];
                    for(var i = 0; i < ret.data.length; ++i) {
                        msg.push('<p>'+ret.data[i]+'</p>');
                    }

                    $app.dlg_result.show('清理存储空间', msg.join(''));
                } else {
                    $tp.notify_error('清理存储空间失败：' + tp_error_msg(ret.code, ret.message));
                }
            },
            function () {
                _sto.dom.btn_cleanup.removeAttr('disabled');
                $tp.notify_error('网路故障，清理存储空间失败！');
            },
            120000
        );
    };

    return _sto;
};