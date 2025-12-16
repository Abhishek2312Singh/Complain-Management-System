package com.example.Product.Service.service;

import com.example.Product.Service.dto.ComplainInputDto;
import com.example.Product.Service.dto.ComplainOutputDto;
import com.example.Product.Service.enums.ComplainStatus;
import com.example.Product.Service.model.Complain;
import com.example.Product.Service.repository.ComplainRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class ComplainService {
    @Autowired
    private ComplainRepo complainRepo;

    public ComplainOutputDto convertToDto(Complain complain){
        ComplainOutputDto complainOutputDto = new ComplainOutputDto();
        complainOutputDto.setComplain(complain.getComplain());
        complainOutputDto.setComplainDate(complain.getComplainDate());
        complainOutputDto.setComplainNumber(complain.getComplainNumber());
        complainOutputDto.setUsername(complain.getUsername());
        complainOutputDto.setMobile(complain.getMobile());
        complainOutputDto.setEmail(complain.getEmail());
        complainOutputDto.setAddress(complain.getAddress());
        complainOutputDto.setStatus(complain.getStatus());
        complainOutputDto.setComplainResponse(complain.getComplainResponse());
        complainOutputDto.setManagerEmail(complain.getManager().getEmail());
        complainOutputDto.setManagerName(complain.getManager().getFullName());
        complainOutputDto.setManagerMobile(complain.getManager().getMobile());
        return complainOutputDto;
    }

    public String addComplain(ComplainInputDto complainInputDto){
        Complain complain = new Complain();
        complain.setComplain(complainInputDto.getComplain());
        complain.setEmail(complainInputDto.getEmail());
        complain.setAddress(complainInputDto.getAddress());
        complain.setUsername(complainInputDto.getUsername());
        complain.setMobile(complainInputDto.getMobile());
        complain.setStatus(ComplainStatus.PENDING);
        complain.setComplainDate(LocalDate.now());
        String complainNumber = LocalDate.now().toString().replace("-","")
                + (1001 + complainRepo.countByComplainDate(LocalDate.now())) ;
        complain.setComplainNumber(complainNumber);
        complainRepo.save(complain);
        return complainNumber;
    }
    public ComplainOutputDto getComplainByComplainNumber(String complainNumber){
        Complain complain = complainRepo.findByComplainNumber(complainNumber).orElseThrow(()->new RuntimeException("No Complain Found!!"));
        ComplainOutputDto complainOutputDto = new ComplainOutputDto();
        complainOutputDto.setComplain(complain.getComplain());
        complainOutputDto.setMobile(complain.getMobile());
        complainOutputDto.setComplainDate(complain.getComplainDate());
        complainOutputDto.setUsername(complain.getUsername());
        complainOutputDto.setEmail(complain.getEmail());
        complainOutputDto.setComplainNumber(complain.getComplainNumber());
        complainOutputDto.setAddress(complain.getAddress());
        complainOutputDto.setStatus(complain.getStatus());
        if(complain.getStatus() == ComplainStatus.PENDING){
            return complainOutputDto;
        } else {
            complainOutputDto.setManagerEmail(complain.getManager().getEmail());
            complainOutputDto.setManagerName(complain.getManager().getFullName());
            complainOutputDto.setManagerMobile(complain.getManager().getMobile());
            complainOutputDto.setComplainResponse(complain.getComplainResponse());
            return complainOutputDto;
        }
    }
    public List<ComplainOutputDto> getComplainByComplainNumberAndStatus(String status, String complainNumber){
        List<Complain> complainList = complainRepo.findByStatusAndComplainNumberEndsWith(ComplainStatus.valueOf(status.toUpperCase()),complainNumber);
        List<ComplainOutputDto> complainOutputDtos = new ArrayList<>();
        for(Complain complain : complainList){
            if(status.equals(ComplainStatus.PENDING.toString())){
                ComplainOutputDto complainOutputDto = new ComplainOutputDto();
                complainOutputDto.setComplain(complain.getComplain());
                complainOutputDto.setMobile(complain.getMobile());
                complainOutputDto.setComplainDate(complain.getComplainDate());
                complainOutputDto.setUsername(complain.getUsername());
                complainOutputDto.setEmail(complain.getEmail());
                complainOutputDto.setComplainNumber(complain.getComplainNumber());
                complainOutputDto.setAddress(complain.getAddress());
                complainOutputDto.setStatus(complain.getStatus());
                complainOutputDtos.add(complainOutputDto);
            }
            else {
                complainOutputDtos.add(convertToDto(complain));
            }
        }

        return complainOutputDtos;
    }
}
