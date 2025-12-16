package com.example.Product.Service.controller;

import com.example.Product.Service.dto.ComplainOutputDto;
import com.example.Product.Service.dto.UserInputDto;
import com.example.Product.Service.dto.UserOutputDto;
import com.example.Product.Service.model.Complain;
import com.example.Product.Service.service.ManagerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/manager")
public class ManagerController {
    @Autowired
    private ManagerService managerService;
    @GetMapping("/getall")
    public ResponseEntity<?> getAllManager(Principal principal){
        return ResponseEntity.ok(managerService.getAllManager(principal));
    }
    @PostMapping("/addmanager")
    public ResponseEntity<String> addManager(@RequestBody UserInputDto userInputDto){
        return ResponseEntity.ok(managerService.addManager(userInputDto));
    }
    @GetMapping("/getcomplain")
    public ResponseEntity<List<ComplainOutputDto>> getComplain(Principal principal){
        return ResponseEntity.ok(managerService.getComplainByManager(principal.getName()));
    }
    @PutMapping("/addresponse")
    public ResponseEntity<Void> addResponse(@RequestParam String complainNumber,@RequestParam String response){
        managerService.addResponse(response,complainNumber);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
