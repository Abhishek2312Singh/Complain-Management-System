package com.example.Product.Service.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class MailingService {
    @Autowired
    private JavaMailSender mailSender;

    public  void sendsSimpleMail(String to, String subject, String body){
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        message.setFrom("abhishekrbs.singh@gmial.com");
        mailSender.send(message);
    }
}
