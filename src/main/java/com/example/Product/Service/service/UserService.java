package com.example.Product.Service.service;

import com.example.Product.Service.config.SecurityConfig;
import com.example.Product.Service.dto.ComplainOutputDto;
import com.example.Product.Service.dto.UserInputDto;
import com.example.Product.Service.dto.UserOutputDto;
import com.example.Product.Service.enums.ComplainStatus;
import com.example.Product.Service.model.Complain;
import com.example.Product.Service.model.Manager;
import com.example.Product.Service.model.User;
import com.example.Product.Service.repository.ComplainRepo;
import com.example.Product.Service.repository.ManagerRepo;
import com.example.Product.Service.repository.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.security.Principal;
import java.util.ArrayList;
import java.util.List;

@Service
public class UserService{
    @Autowired
    private MailingService mailingService;
    @Autowired
    private SecurityConfig config;
    @Autowired
    private UserRepo userRepo;
    @Autowired
    private ComplainRepo complainRepo;
    @Autowired
    private ManagerRepo managerRepo;
    @Autowired
    private ComplainService complainService;

    public List<String> getAllComplainByStatus(String status){
        List<Complain> complainList = complainRepo.findAllByStatus(ComplainStatus.valueOf(status));
        List<String> complainNumberList = new ArrayList<>();
        for(Complain complain : complainList){
            String complainNumber;
            complainNumber = complain.getComplainNumber();
            complainNumberList.add(complainNumber);
        }
        return complainNumberList;
    }
    public List<String> getAllManager(){
        List<String> managerName = new ArrayList<>();
        List<Manager> managers = managerRepo.findAll();
        for(Manager manager : managers){
            String username;
            username = manager.getUsername();
            managerName.add(username);
        }
        return managerName;
    }
    public Manager getManagerByUsername(String username){
        return managerRepo.findByUsername(username).orElseThrow(()->new UsernameNotFoundException("Manager Not Found"));
    }
    public void assignManager(String complainNumber,String managerUsername){
        Complain complain = complainRepo.findByComplainNumber(complainNumber).orElseThrow(()->new RuntimeException("Complain not found!!"));
        complain.setManager(getManagerByUsername(managerUsername));
        complain.setStatus(ComplainStatus.IN_PROCESS);
        complainRepo.save(complain);
    }
    public List<ComplainOutputDto> getComplainByManagerOrStatus(Manager manager, String status){
        List<Complain> complainList = complainRepo.findByManagerOrStatus(manager,ComplainStatus.valueOf(status));
        List<ComplainOutputDto> complainOutputDtos = new ArrayList<>();
        for(Complain complain : complainList){
            complainOutputDtos.add(complainService.convertToDto(complain));
        }
        return complainOutputDtos;
    }
    public void setComplainClosed(String complainNumber){
        Complain complain = complainRepo.findByComplainNumber(complainNumber).orElseThrow(()->new RuntimeException("Complain Not Found!!"));
        complain.setStatus(ComplainStatus.CLOSED);
        String to = complain.getEmail();
        String subject = "Response generated : " + complainNumber;
        String body = "Hello,\n\t" + complain.getUsername() + ", your complain has been closed. Please track your complain " +
                "with Complain Number : " + complainNumber + "\nVisit Here : http://localhost:5173\n\n\nThank You" +
                "\nManager Name : " + complain.getManager().getFullName() +
                "\nManager Email : " + complain.getManager().getEmail();
        System.out.println(body);
        complainRepo.save(complain);
//        mailingService.sendsSimpleMail(to,subject,body);
    }
    public UserOutputDto getUser(Principal principal){
        if(principal.getName().equals("admin")){
        User user = userRepo.findByUsername(principal.getName()).orElseThrow(()-> new UsernameNotFoundException("Admin not found!!"));
        UserOutputDto userOutputDto = new UserOutputDto();
        userOutputDto.setFullName(user.getFullName());
        userOutputDto.setMobile(user.getMobile());
        userOutputDto.setEmail(user.getEmail());
        userOutputDto.setUsername(user.getUsername());
        return userOutputDto;
        }
        else{
            Manager manager = managerRepo.findByUsername(principal.getName()).orElseThrow(()->new UsernameNotFoundException("Manager Not Found!!"));
            UserOutputDto userOutputDto = new UserOutputDto();
            userOutputDto.setFullName(manager.getFullName());
            userOutputDto.setMobile(manager.getMobile().toString());
            userOutputDto.setEmail(manager.getEmail());
            userOutputDto.setUsername(manager.getUsername());
            return userOutputDto;
        }
    }
    public String updateUser(UserInputDto userInputDto,Principal principal){
        if(principal.getName().equals("admin")) {
            User user = userRepo.findByUsername(principal.getName()).orElseThrow(() -> new UsernameNotFoundException("User not found!!"));
            user.setMobile(userInputDto.getMobile());
            user.setEmail(userInputDto.getEmail());
            userRepo.save(user);
        }else {
            Manager manager = managerRepo.findByUsername(principal.getName()).orElseThrow(() -> new UsernameNotFoundException("User not found!!"));
            manager.setEmail(userInputDto.getEmail());
            manager.setMobile(Long.parseLong(userInputDto.getMobile()));
            managerRepo.save(manager);
        }
        return "Profile Updated!!";
    }
    public String updatePassword(String currentPassword,String newPassword,String confirmPassword,Principal principal){
        if(principal.getName().equals("admin")) {
            User user = userRepo.findByUsername(principal.getName()).orElseThrow(() -> new UsernameNotFoundException("User not found!!"));
            if (config.encoder().matches(currentPassword, user.getPassword())) {
                if (newPassword.equals(confirmPassword)) {
                    user.setPassword(config.encoder().encode(newPassword));
                    userRepo.save(user);
                    return "Password Updated!!";
                } else {
                    throw new RuntimeException("New Password and Current Password Not Matched!!");
                }
            } else {
                throw new RuntimeException("Wrong Password!!");
            }
        }else{
            Manager manager = managerRepo.findByUsername(principal.getName()).orElseThrow(() -> new UsernameNotFoundException("User not found!!"));
            if (config.encoder().matches(currentPassword, manager.getPassword())) {
                if (newPassword.equals(confirmPassword)) {
                    manager.setPassword(config.encoder().encode(newPassword));
                    managerRepo.save(manager);
                    return "Password Updated!!";
                } else {
                    throw new RuntimeException("New Password and Current Password Not Matched!!");
                }
            } else {
                throw new RuntimeException("Wrong Password!!");
            }
        }
    }
}
