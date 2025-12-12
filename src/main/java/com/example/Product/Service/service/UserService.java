package com.example.Product.Service.service;

import com.example.Product.Service.dto.ComplainOutputDto;
import com.example.Product.Service.enums.ComplainStatus;
import com.example.Product.Service.model.Complain;
import com.example.Product.Service.model.Manager;
import com.example.Product.Service.repository.ComplainRepo;
import com.example.Product.Service.repository.ManagerRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class UserService{
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

}
