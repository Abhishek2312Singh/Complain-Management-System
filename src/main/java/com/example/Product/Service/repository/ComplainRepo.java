package com.example.Product.Service.repository;

import com.example.Product.Service.enums.ComplainStatus;
import com.example.Product.Service.model.Complain;
import com.example.Product.Service.model.Manager;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ComplainRepo extends JpaRepository<Complain,Long> {
    Long countByComplainDate(LocalDate date);
    Optional<Complain> findByComplainNumber(String complainNumber);
    List<Complain> findAllByStatus(ComplainStatus status);
    List<Complain> findByManagerAndStatus(Manager manager, ComplainStatus status);
    List<Complain> findByManagerOrStatus(Manager manager, ComplainStatus status);
    List<Complain> findByStatusAndComplainNumberEndsWith(ComplainStatus status, String complainNumber);
}
