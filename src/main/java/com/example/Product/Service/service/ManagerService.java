package com.example.Product.Service.service;

import com.example.Product.Service.config.SecurityConfig;
import com.example.Product.Service.dto.ComplainOutputDto;
import com.example.Product.Service.dto.UserInputDto;
import com.example.Product.Service.dto.UserOutputDto;
import com.example.Product.Service.enums.ComplainStatus;
import com.example.Product.Service.model.Complain;
import com.example.Product.Service.model.Manager;
import com.example.Product.Service.repository.ComplainRepo;
import com.example.Product.Service.repository.ManagerRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.security.Principal;
import java.util.ArrayList;
import java.util.List;

@Service
public class ManagerService {
    @Autowired
    private SecurityConfig config;
    @Autowired
    private ComplainRepo complainRepo;
    @Autowired
    private ManagerRepo managerRepo;
    @Autowired
    private ComplainService complainService;
    public List<ComplainOutputDto> getComplainByManager(String username){
        List<Complain> complainList = complainRepo.findByManagerAndStatus(managerRepo.findByUsername(username).orElseThrow(
                        ()->new UsernameNotFoundException("Manager Not found!!!")
                ),
               ComplainStatus.PENDING);
        List<ComplainOutputDto> complainOutputDtos = new ArrayList<>();
        for(Complain complain : complainList){
            complainOutputDtos.add(complainService.convertToDto(complain));
        }
        return complainOutputDtos;
    }
    public ComplainOutputDto getComplainByNumber(String complainNumber){
        return complainService.getComplainByComplainNumber(complainNumber);
    }
    public void addResponse(String response, String complainNumber){
        Complain complain = complainRepo.findByComplainNumber(complainNumber).orElseThrow(()->new RuntimeException("Complain Not Found!!"));
        complain.setComplainResponse(response);
        complainRepo.save(complain);
    }
    public List<UserOutputDto> getAllManager(Principal principal){
        if(principal.getName().equals("admin")){
        List<Manager> managers = managerRepo.findAll();
        List<UserOutputDto> userOutputDtos = new ArrayList<>();
        for(Manager manager : managers){
            UserOutputDto userOutputDto = new UserOutputDto();
            userOutputDto.setUsername(manager.getUsername());
            userOutputDto.setFullName(manager.getFullName());
            userOutputDto.setEmail(manager.getEmail());
            userOutputDto.setMobile(manager.getMobile().toString());
            userOutputDtos.add(userOutputDto);
        }
        return userOutputDtos;
    }
        throw new RuntimeException("Unauthorized User!!");
    }
    public String addManager(UserInputDto userInputDto){
        Manager manager = new Manager();
        manager.setEmail(userInputDto.getEmail());
        String[] fullName = userInputDto.getFullName().toLowerCase().split(" ");
        String username = fullName[0].charAt(0) + String.valueOf(fullName[1].charAt(0));
        username = (username  + userInputDto.getMobile().substring(6)
                + (managerRepo.countByUsernameStartsWith(username.substring(0,1))+1)).toLowerCase();

        manager.setUsername(username);
        manager.setPassword(config.encoder().encode(username));
        manager.setEmail(userInputDto.getEmail());
        manager.setFullName(userInputDto.getFullName());
        manager.setMobile(Long.parseLong(userInputDto.getMobile()));
        managerRepo.save(manager);
        return "New Manager Added!!";
    }
}
