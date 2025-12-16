package com.example.Product.Service.controller;

import com.example.Product.Service.dto.UserInputDto;
import com.example.Product.Service.dto.UserOutputDto;
import com.example.Product.Service.service.ManagerService;
import org.springframework.beans.factory.annotation.Autowired;
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
}
